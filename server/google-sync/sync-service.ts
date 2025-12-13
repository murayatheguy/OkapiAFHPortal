import { storage } from "../storage";
import type { Facility } from "@shared/schema";

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GooglePlaceDetailsResult {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    rating?: number;
    user_ratings_total?: number;
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
      html_attributions: string[];
    }>;
  };
}

export async function findGooglePlaceId(facilityName: string, address: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY not configured");
    return null;
  }

  try {
    const query = `${facilityName} ${address}`;
    const params = new URLSearchParams({
      input: query,
      inputtype: "textquery",
      key: apiKey,
      fields: "place_id,name,formatted_address",
      locationbias: "rectangle:45.5435,-124.8488|49.0024,-116.9155",
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].place_id;
    }
    
    return null;
  } catch (error) {
    console.error("Error finding Google Place ID:", error);
    return null;
  }
}

export async function fetchGooglePlaceDetails(placeId: string): Promise<{
  rating?: number;
  reviewCount?: number;
  photos?: string[];
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY not configured");
    return null;
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey,
      fields: "rating,user_ratings_total,photos",
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data: GooglePlaceDetailsResult = await response.json();
    
    if (data.result) {
      const photoReferences = data.result.photos?.slice(0, 5).map(p => p.photo_reference) || [];
      
      return {
        rating: data.result.rating,
        reviewCount: data.result.user_ratings_total,
        photos: photoReferences,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching Google Place details:", error);
    return null;
  }
}

export function getGooglePhotoUrl(photoReference: string, maxWidth: number = 400): string {
  return `/api/google/places/photo?photo_reference=${encodeURIComponent(photoReference)}&max_width=${maxWidth}`;
}

export async function syncGoogleDataForFacility(facility: Facility): Promise<boolean> {
  try {
    let placeId = facility.googlePlaceId;
    
    if (!placeId) {
      const fullAddress = `${facility.address}, ${facility.city}, ${facility.state} ${facility.zipCode}`;
      placeId = await findGooglePlaceId(facility.name, fullAddress);
      
      if (!placeId) {
        console.log(`No Google Place found for: ${facility.name}`);
        return false;
      }
    }
    
    const details = await fetchGooglePlaceDetails(placeId);
    
    if (!details) {
      console.log(`Could not fetch details for place: ${placeId}`);
      return false;
    }
    
    const photoUrls = details.photos?.map(ref => getGooglePhotoUrl(ref, 800)) || [];
    
    await storage.updateFacility(facility.id, {
      googlePlaceId: placeId,
      googleRating: details.rating?.toString(),
      googleReviewCount: details.reviewCount,
      googlePhotos: photoUrls,
      googleSyncedAt: new Date(),
    });
    
    console.log(`Synced Google data for: ${facility.name}`);
    return true;
  } catch (error) {
    console.error(`Error syncing Google data for ${facility.name}:`, error);
    return false;
  }
}

export async function syncGooglePhotosForAllFacilities(limit: number = 10): Promise<{
  synced: number;
  failed: number;
  skipped: number;
}> {
  const results = {
    synced: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    const facilities = await storage.searchFacilities({});
    
    const facilitiesToSync = facilities
      .filter(f => !f.googleSyncedAt || 
        (new Date().getTime() - new Date(f.googleSyncedAt).getTime()) > 7 * 24 * 60 * 60 * 1000)
      .slice(0, limit);
    
    console.log(`Syncing ${facilitiesToSync.length} facilities with Google...`);
    
    for (const facility of facilitiesToSync) {
      if (facility.images && facility.images.length > 0) {
        results.skipped++;
        continue;
      }
      
      const success = await syncGoogleDataForFacility(facility);
      
      if (success) {
        results.synced++;
      } else {
        results.failed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Sync complete: ${results.synced} synced, ${results.failed} failed, ${results.skipped} skipped`);
    return results;
  } catch (error) {
    console.error("Error in batch sync:", error);
    return results;
  }
}
