import { Router } from "express";
import { calculateCareScore, recalculateAllScores } from "../../services/careScore";
import { success, error } from "../../utils/responses";
import { db } from "../../db";
import { facilities, facilityCompliance } from "@shared/schema";
import { eq, desc, isNotNull, and } from "drizzle-orm";

export const careScoreRouter = Router();

// Scoring methodology explanation (put first to avoid :facilityId capture)
careScoreRouter.get("/methodology", (req, res) => {
  res.json(success({
    name: "Okapi Care Score",
    version: "1.0",
    description: "Comprehensive quality rating based on regulatory compliance, owner involvement, and family feedback",
    weights: {
      violations: { weight: 35, description: "DSHS inspection history (24-month window)" },
      ownerInvolvement: { weight: 20, description: "Owner presence and engagement" },
      staffing: { weight: 15, description: "Staff qualifications and specializations" },
      tenure: { weight: 10, description: "Years in operation" },
      reviews: { weight: 10, description: "Family feedback and ratings" },
      responseTime: { weight: 5, description: "Inquiry response speed" },
      transparency: { weight: 5, description: "Profile completeness" },
    },
    ratings: {
      "A+": "95-100 (Exceptional)",
      "A": "85-94 (Excellent)",
      "B": "75-84 (Good)",
      "C": "65-74 (Fair)",
      "D": "50-64 (Needs Improvement)",
      "F": "Below 50 (Poor)",
      "NR": "Not Rated",
    },
  }));
});

// Get top-rated facilities
careScoreRouter.get("/top", async (req, res) => {
  try {
    const { city, type, limit = "20" } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 50);

    // Build query
    const results = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        slug: facilities.slug,
        city: facilities.city,
        facilityType: facilities.facilityType,
        rating: facilities.rating,
        reviewCount: facilities.reviewCount,
        careScore: facilityCompliance.totalScore,
        careRating: facilityCompliance.scoreRating,
      })
      .from(facilities)
      .leftJoin(facilityCompliance, eq(facilities.id, facilityCompliance.facilityId))
      .where(and(
        eq(facilities.status, "active"),
        isNotNull(facilityCompliance.totalScore)
      ))
      .orderBy(desc(facilityCompliance.totalScore))
      .limit(limitNum);

    res.json(success({
      facilities: results,
      total: results.length,
    }));
  } catch (err) {
    console.error("Get top facilities error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to get top facilities"));
  }
});

// Get Care Score for a facility
careScoreRouter.get("/:facilityId", async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { recalculate } = req.query;

    // Optionally force recalculation
    if (recalculate === "true") {
      const result = await calculateCareScore(facilityId);
      return res.json(success(result));
    }

    // Get cached score from facility_compliance
    const [compliance] = await db
      .select()
      .from(facilityCompliance)
      .where(eq(facilityCompliance.facilityId, facilityId));

    if (!compliance?.totalScore) {
      // No cached score, calculate now
      const result = await calculateCareScore(facilityId);
      return res.json(success(result));
    }

    // Return cached score
    res.json(success({
      totalScore: compliance.totalScore,
      rating: compliance.scoreRating,
      calculatedAt: compliance.scoreCalculatedAt,
      cached: true,
    }));
  } catch (err: any) {
    console.error("Get care score error:", err);
    res.status(500).json(error("INTERNAL_ERROR", err.message || "Failed to get score"));
  }
});

// Get Care Score breakdown (detailed)
careScoreRouter.get("/:facilityId/breakdown", async (req, res) => {
  try {
    const { facilityId } = req.params;
    const result = await calculateCareScore(facilityId);
    res.json(success(result));
  } catch (err: any) {
    console.error("Get care score breakdown error:", err);
    res.status(500).json(error("INTERNAL_ERROR", err.message || "Failed to get score"));
  }
});
