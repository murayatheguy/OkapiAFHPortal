import { db } from "../db";
import { facilities, facilityCompliance, reviews } from "@shared/schema";
import { eq, and, avg, count, sql, desc, isNull } from "drizzle-orm";
import { logger } from "../utils/logger";

// Scoring weights (total = 100)
const WEIGHTS = {
  violations: 35,      // DSHS compliance history
  ownerInvolvement: 20, // Owner presence and engagement
  staffing: 15,        // Staff qualifications and ratios
  tenure: 10,          // Years in operation
  reviews: 10,         // Family feedback
  responseTime: 5,     // Inquiry response speed
  transparency: 5,     // Profile completeness
};

interface CareScoreResult {
  totalScore: number;
  rating: "A+" | "A" | "B" | "C" | "D" | "F" | "NR";
  breakdown: {
    violations: { score: number; weight: number; details: any };
    ownerInvolvement: { score: number; weight: number; details: any };
    staffing: { score: number; weight: number; details: any };
    tenure: { score: number; weight: number; details: any };
    reviews: { score: number; weight: number; details: any };
    responseTime: { score: number; weight: number; details: any };
    transparency: { score: number; weight: number; details: any };
  };
  calculatedAt: Date;
}

/**
 * Calculate Care Score for a facility
 */
export async function calculateCareScore(facilityId: string): Promise<CareScoreResult> {
  logger.info({ facilityId }, "Calculating care score");

  // Get facility data
  const [facility] = await db
    .select()
    .from(facilities)
    .where(eq(facilities.id, facilityId));

  if (!facility) {
    throw new Error("Facility not found");
  }

  // Get compliance data
  const [compliance] = await db
    .select()
    .from(facilityCompliance)
    .where(eq(facilityCompliance.facilityId, facilityId));

  // Get review stats
  const [reviewStats] = await db
    .select({
      avgRating: avg(reviews.rating),
      reviewCount: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.facilityId, facilityId));

  // Calculate each component
  const violationsScore = calculateViolationsScore(compliance);
  const ownerScore = calculateOwnerInvolvementScore(facility, compliance);
  const staffingScore = calculateStaffingScore(facility);
  const tenureScore = calculateTenureScore(facility);
  const reviewsScore = calculateReviewsScore(reviewStats);
  const responseScore = calculateResponseTimeScore(facility);
  const transparencyScore = calculateTransparencyScore(facility);

  // Calculate weighted total
  const totalScore = Math.round(
    (violationsScore.score * WEIGHTS.violations / 100) +
    (ownerScore.score * WEIGHTS.ownerInvolvement / 100) +
    (staffingScore.score * WEIGHTS.staffing / 100) +
    (tenureScore.score * WEIGHTS.tenure / 100) +
    (reviewsScore.score * WEIGHTS.reviews / 100) +
    (responseScore.score * WEIGHTS.responseTime / 100) +
    (transparencyScore.score * WEIGHTS.transparency / 100)
  );

  const rating = scoreToRating(totalScore);

  const result: CareScoreResult = {
    totalScore,
    rating,
    breakdown: {
      violations: { ...violationsScore, weight: WEIGHTS.violations },
      ownerInvolvement: { ...ownerScore, weight: WEIGHTS.ownerInvolvement },
      staffing: { ...staffingScore, weight: WEIGHTS.staffing },
      tenure: { ...tenureScore, weight: WEIGHTS.tenure },
      reviews: { ...reviewsScore, weight: WEIGHTS.reviews },
      responseTime: { ...responseScore, weight: WEIGHTS.responseTime },
      transparency: { ...transparencyScore, weight: WEIGHTS.transparency },
    },
    calculatedAt: new Date(),
  };

  // Update facility compliance with new score
  if (compliance) {
    await db.update(facilityCompliance)
      .set({
        totalScore,
        scoreRating: rating,
        scoreCalculatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(facilityCompliance.facilityId, facilityId));
  }

  logger.info({ facilityId, totalScore, rating }, "Care score calculated");

  return result;
}

/**
 * Violations score (35% weight)
 * Based on DSHS inspection history - 24 month window
 */
function calculateViolationsScore(compliance: any): { score: number; details: any } {
  if (!compliance) {
    return { score: 50, details: { reason: "No compliance data available" } };
  }

  const { criticalViolations, seriousViolations, moderateViolations, minorViolations, hasAbuseFinding, monthsViolationFree } = compliance;

  // Abuse finding = automatic 0
  if (hasAbuseFinding) {
    return { score: 0, details: { reason: "Abuse finding on record", hasAbuseFinding: true } };
  }

  // Start at 100, deduct for violations
  let score = 100;
  score -= (criticalViolations || 0) * 30;  // -30 per critical
  score -= (seriousViolations || 0) * 15;   // -15 per serious
  score -= (moderateViolations || 0) * 5;   // -5 per moderate
  score -= (minorViolations || 0) * 2;      // -2 per minor

  // Bonus for clean record
  if (monthsViolationFree >= 24) score = Math.min(100, score + 10);
  else if (monthsViolationFree >= 12) score = Math.min(100, score + 5);

  return {
    score: Math.max(0, Math.min(100, score)),
    details: {
      criticalViolations,
      seriousViolations,
      moderateViolations,
      minorViolations,
      monthsViolationFree,
    },
  };
}

/**
 * Owner involvement score (20% weight)
 */
function calculateOwnerInvolvementScore(facility: any, compliance: any): { score: number; details: any } {
  let score = 50; // Base score

  // Lives on site = major bonus
  if (facility.ownerLivesOnSite) score += 30;

  // Has succession plan (2025 requirement)
  if (compliance?.hasSuccessionPlan) score += 10;

  // Verified ownership
  if (facility.claimStatus === "verified") score += 10;

  return {
    score: Math.min(100, score),
    details: {
      livesOnSite: facility.ownerLivesOnSite,
      hasSuccessionPlan: compliance?.hasSuccessionPlan,
      isVerified: facility.claimStatus === "verified",
    },
  };
}

/**
 * Staffing score (15% weight)
 */
function calculateStaffingScore(facility: any): { score: number; details: any } {
  let score = 60; // Base score

  // Bonus for specializations
  const specialties = facility.specialties || [];
  if (specialties.includes("dementia") || specialties.includes("memory_care")) score += 15;
  if (specialties.includes("mental_health")) score += 10;
  if (specialties.includes("hospice")) score += 10;

  return {
    score: Math.min(100, score),
    details: {
      specialties,
    },
  };
}

/**
 * Tenure score (10% weight)
 */
function calculateTenureScore(facility: any): { score: number; details: any } {
  const yearEstablished = facility.yearEstablished;

  if (!yearEstablished) {
    return { score: 50, details: { yearsInOperation: null } };
  }

  const currentYear = new Date().getFullYear();
  const yearsInOperation = currentYear - yearEstablished;

  let score = 50;
  if (yearsInOperation >= 10) score = 100;
  else if (yearsInOperation >= 5) score = 85;
  else if (yearsInOperation >= 3) score = 70;
  else if (yearsInOperation >= 1) score = 60;

  return {
    score,
    details: { yearsInOperation },
  };
}

/**
 * Reviews score (10% weight)
 */
function calculateReviewsScore(reviewStats: any): { score: number; details: any } {
  const avgRating = parseFloat(reviewStats?.avgRating) || 0;
  const reviewCount = parseInt(reviewStats?.reviewCount) || 0;

  if (reviewCount === 0) {
    return { score: 50, details: { avgRating: 0, reviewCount: 0, reason: "No reviews" } };
  }

  // Base score from rating (0-5 scale to 0-100)
  let score = (avgRating / 5) * 100;

  // Bonus for having multiple reviews (up to 10 bonus points)
  const reviewBonus = Math.min(10, reviewCount);
  score = Math.min(100, score + reviewBonus);

  return {
    score: Math.round(score),
    details: { avgRating, reviewCount },
  };
}

/**
 * Response time score (5% weight)
 */
function calculateResponseTimeScore(facility: any): { score: number; details: any } {
  // TODO: Calculate based on actual inquiry response times
  // For now, give base score
  const avgResponseHours = null;

  if (!avgResponseHours) {
    return { score: 50, details: { avgResponseHours: null } };
  }

  let score = 100;
  if (avgResponseHours > 48) score = 30;
  else if (avgResponseHours > 24) score = 60;
  else if (avgResponseHours > 12) score = 80;
  else if (avgResponseHours > 4) score = 90;

  return { score, details: { avgResponseHours } };
}

/**
 * Transparency score (5% weight)
 * Based on profile completeness
 */
function calculateTransparencyScore(facility: any): { score: number; details: any } {
  const fields = [
    facility.description,
    facility.phone,
    facility.email,
    facility.website,
    facility.images?.length > 0,
    facility.amenities?.length > 0,
    facility.careTypes?.length > 0,
    facility.priceMin,
    facility.latitude && facility.longitude,
    facility.yearEstablished,
  ];

  const filledFields = fields.filter(Boolean).length;
  const score = Math.round((filledFields / fields.length) * 100);

  return {
    score,
    details: {
      filledFields,
      totalFields: fields.length,
      completionPercent: score,
    },
  };
}

/**
 * Convert numeric score to letter rating
 */
function scoreToRating(score: number): CareScoreResult["rating"] {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  if (score > 0) return "F";
  return "NR"; // Not Rated
}

/**
 * Batch recalculate scores for all facilities
 */
export async function recalculateAllScores(): Promise<{ updated: number; errors: number }> {
  const allFacilities = await db
    .select({ id: facilities.id })
    .from(facilities)
    .where(eq(facilities.status, "active"));

  let updated = 0;
  let errors = 0;

  for (const facility of allFacilities) {
    try {
      await calculateCareScore(facility.id);
      updated++;
    } catch (err) {
      logger.error({ facilityId: facility.id, err }, "Failed to calculate score");
      errors++;
    }
  }

  logger.info({ updated, errors }, "Batch score recalculation complete");
  return { updated, errors };
}
