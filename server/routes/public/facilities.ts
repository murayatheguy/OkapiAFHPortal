import { Router } from "express";
import { db } from "../../db";
import { facilities, facilityImages } from "@shared/schema";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { success, paginated, error } from "../../utils/responses";

export const facilitiesRouter = Router();

// Search facilities (public, no PHI)
facilitiesRouter.get("/", async (req, res) => {
  try {
    const {
      city,
      type,
      county,
      q, // search query
      page = "1",
      limit = "20"
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions = [eq(facilities.status, "active")];

    if (city) {
      conditions.push(ilike(facilities.city, `%${city}%`));
    }

    if (county) {
      conditions.push(ilike(facilities.county, `%${county}%`));
    }

    if (type) {
      conditions.push(eq(facilities.facilityType, type as string));
    }

    if (q) {
      conditions.push(
        or(
          ilike(facilities.name, `%${q}%`),
          ilike(facilities.city, `%${q}%`),
          ilike(facilities.description, `%${q}%`)
        )!
      );
    }

    // Select only public fields (NO PHI)
    const results = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        slug: facilities.slug,
        facilityType: facilities.facilityType,
        address: facilities.address,
        city: facilities.city,
        state: facilities.state,
        zipCode: facilities.zipCode,
        county: facilities.county,
        phone: facilities.phone,
        description: facilities.description,
        capacity: facilities.capacity,
        availableBeds: facilities.availableBeds,
        specialties: facilities.specialties,
        amenities: facilities.amenities,
        careTypes: facilities.careTypes,
        priceMin: facilities.priceMin,
        priceMax: facilities.priceMax,
        acceptsMedicaid: facilities.acceptsMedicaid,
        acceptingInquiries: facilities.acceptingInquiries,
        isVerified: facilities.claimStatus,
        rating: facilities.rating,
        reviewCount: facilities.reviewCount,
        images: facilities.images,
        latitude: facilities.latitude,
        longitude: facilities.longitude,
        featured: facilities.featured,
      })
      .from(facilities)
      .where(and(...conditions))
      .limit(limitNum)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(facilities)
      .where(and(...conditions));

    res.json(paginated(results, pageNum, limitNum, Number(count)));
  } catch (err) {
    console.error("Facility search error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Search failed"));
  }
});

// Get single facility by ID or slug (public)
facilitiesRouter.get("/:idOrSlug", async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Try to find by ID or slug
    const [facility] = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        slug: facilities.slug,
        facilityType: facilities.facilityType,
        address: facilities.address,
        city: facilities.city,
        state: facilities.state,
        zipCode: facilities.zipCode,
        county: facilities.county,
        phone: facilities.phone,
        email: facilities.email,
        website: facilities.website,
        description: facilities.description,
        capacity: facilities.capacity,
        availableBeds: facilities.availableBeds,
        specialties: facilities.specialties,
        amenities: facilities.amenities,
        careTypes: facilities.careTypes,
        certifications: facilities.certifications,
        priceMin: facilities.priceMin,
        priceMax: facilities.priceMax,
        acceptsMedicaid: facilities.acceptsMedicaid,
        acceptsPrivatePay: facilities.acceptsPrivatePay,
        acceptingInquiries: facilities.acceptingInquiries,
        claimStatus: facilities.claimStatus,
        rating: facilities.rating,
        reviewCount: facilities.reviewCount,
        images: facilities.images,
        latitude: facilities.latitude,
        longitude: facilities.longitude,
        yearEstablished: facilities.yearEstablished,
        licenseNumber: facilities.licenseNumber,
        licenseStatus: facilities.licenseStatus,
        ownerBio: facilities.ownerBio,
        carePhilosophy: facilities.carePhilosophy,
        dailyRoutine: facilities.dailyRoutine,
        uniqueFeatures: facilities.uniqueFeatures,
        roomTypes: facilities.roomTypes,
        googleRating: facilities.googleRating,
        googleReviewCount: facilities.googleReviewCount,
      })
      .from(facilities)
      .where(
        and(
          eq(facilities.status, "active"),
          or(
            eq(facilities.id, idOrSlug),
            eq(facilities.slug, idOrSlug)
          )
        )
      );

    if (!facility) {
      return res.status(404).json(error("NOT_FOUND", "Facility not found"));
    }

    // Get gallery images
    const images = await db
      .select()
      .from(facilityImages)
      .where(eq(facilityImages.facilityId, facility.id))
      .orderBy(facilityImages.sortOrder);

    res.json(success({ ...facility, galleryImages: images }));
  } catch (err) {
    console.error("Facility detail error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to get facility"));
  }
});
