/**
 * Google Places API Client
 *
 * Official Places API integration for finding places and fetching photos.
 * Uses Text Search (New) and Place Photos endpoints.
 *
 * @see https://developers.google.com/maps/documentation/places/web-service
 */

import { logger } from "../utils/logger";

// ============================================================================
// Types
// ============================================================================

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  userRatingsTotal?: number;
  photos?: PlacePhotoReference[];
}

export interface PlacePhotoReference {
  name: string; // Photo resource name (new API format)
  widthPx: number;
  heightPx: number;
  authorAttributions: {
    displayName: string;
    uri: string;
    photoUri: string;
  }[];
}

export interface PlacePhoto {
  photoReference: string;
  width: number;
  height: number;
  attributionText: string;
  attributionUrl?: string;
  photographerName?: string;
}

export interface PhotoDownloadResult {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

// ============================================================================
// Configuration
// ============================================================================

const PLACES_API_BASE = "https://places.googleapis.com/v1";
const PLACES_PHOTO_BASE = "https://places.googleapis.com/v1";

const DEFAULT_PHOTO_MAX_WIDTH = 800;
const DEFAULT_PHOTO_MAX_HEIGHT = 600;

// ============================================================================
// API Client
// ============================================================================

export class GooglePlacesClient {
  private apiKey: string;
  private requestCount = 0;
  private lastRequestTime = 0;
  private minRequestInterval = 100; // ms between requests (rate limiting)

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || "";
    if (!this.apiKey) {
      logger.warn("Google Places API key not configured");
    }
  }

  /**
   * Check if the client is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get request statistics
   */
  getStats(): { requestCount: number } {
    return { requestCount: this.requestCount };
  }

  /**
   * Rate-limited fetch wrapper
   */
  private async rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;

    return fetch(url, options);
  }

  /**
   * Find a place by name and address using Text Search (New)
   */
  async findPlace(params: {
    name: string;
    address: string;
    city: string;
    state: string;
  }): Promise<PlaceSearchResult | null> {
    if (!this.apiKey) {
      throw new Error("Google Places API key not configured");
    }

    const query = `${params.name} ${params.address} ${params.city} ${params.state}`;

    try {
      const response = await this.rateLimitedFetch(
        `${PLACES_API_BASE}/places:searchText`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos",
          },
          body: JSON.stringify({
            textQuery: query,
            maxResultCount: 1,
            languageCode: "en",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error({ status: response.status, error, query }, "Places API search failed");
        return null;
      }

      const data = await response.json();

      if (!data.places || data.places.length === 0) {
        logger.debug({ query }, "No places found");
        return null;
      }

      const place = data.places[0];

      return {
        placeId: place.id,
        name: place.displayName?.text || "",
        formattedAddress: place.formattedAddress || "",
        location: place.location
          ? {
              latitude: place.location.latitude,
              longitude: place.location.longitude,
            }
          : undefined,
        rating: place.rating,
        userRatingsTotal: place.userRatingCount,
        photos: place.photos?.map((p: any) => ({
          name: p.name,
          widthPx: p.widthPx,
          heightPx: p.heightPx,
          authorAttributions: p.authorAttributions || [],
        })),
      };
    } catch (error) {
      logger.error({ error, query }, "Places API request failed");
      throw error;
    }
  }

  /**
   * Get photo references for a place
   */
  async getPlacePhotos(placeId: string): Promise<PlacePhoto[]> {
    if (!this.apiKey) {
      throw new Error("Google Places API key not configured");
    }

    try {
      const response = await this.rateLimitedFetch(
        `${PLACES_API_BASE}/places/${placeId}`,
        {
          method: "GET",
          headers: {
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-FieldMask": "photos",
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error({ status: response.status, error, placeId }, "Get place photos failed");
        return [];
      }

      const data = await response.json();

      if (!data.photos || data.photos.length === 0) {
        return [];
      }

      return data.photos.map((photo: any) => {
        const attribution = photo.authorAttributions?.[0];
        return {
          photoReference: photo.name, // Resource name like "places/xxx/photos/xxx"
          width: photo.widthPx,
          height: photo.heightPx,
          attributionText: attribution?.displayName || "Google Maps",
          attributionUrl: attribution?.uri,
          photographerName: attribution?.displayName,
        };
      });
    } catch (error) {
      logger.error({ error, placeId }, "Get place photos request failed");
      throw error;
    }
  }

  /**
   * Download a photo by its reference
   */
  async downloadPhoto(
    photoReference: string,
    maxWidth: number = DEFAULT_PHOTO_MAX_WIDTH,
    maxHeight: number = DEFAULT_PHOTO_MAX_HEIGHT
  ): Promise<PhotoDownloadResult> {
    if (!this.apiKey) {
      throw new Error("Google Places API key not configured");
    }

    try {
      // photoReference is the resource name like "places/xxx/photos/xxx"
      const photoUrl = `${PLACES_PHOTO_BASE}/${photoReference}/media?maxWidthPx=${maxWidth}&maxHeightPx=${maxHeight}&key=${this.apiKey}`;

      const response = await this.rateLimitedFetch(photoUrl, {
        method: "GET",
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({ status: response.status, error, photoReference }, "Photo download failed");
        throw new Error(`Photo download failed: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const mimeType = response.headers.get("content-type") || "image/jpeg";

      // Try to get actual dimensions from response headers or use requested
      const width = maxWidth;
      const height = maxHeight;

      return {
        buffer,
        mimeType,
        width,
        height,
      };
    } catch (error) {
      logger.error({ error, photoReference }, "Photo download request failed");
      throw error;
    }
  }
}

// Singleton instance
let clientInstance: GooglePlacesClient | null = null;

export function getPlacesClient(): GooglePlacesClient {
  if (!clientInstance) {
    clientInstance = new GooglePlacesClient();
  }
  return clientInstance;
}

export function resetPlacesClient(): void {
  clientInstance = null;
}
