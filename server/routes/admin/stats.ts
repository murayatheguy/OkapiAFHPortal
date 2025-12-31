import { Router } from "express";
import { db } from "../../db";
import { facilities, owners, residents, inquiries, reviews, auditLogs } from "@shared/schema";
import { eq, sql, gte, and } from "drizzle-orm";
import { success, error } from "../../utils/responses";

export const adminStatsRouter = Router();

// Dashboard overview stats
adminStatsRouter.get("/overview", async (req, res) => {
  try {
    // Facilities
    const [facilityStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${facilities.status} = 'active')`,
        verified: sql<number>`count(*) filter (where ${facilities.claimStatus} = 'verified')`,
        pending: sql<number>`count(*) filter (where ${facilities.status} = 'pending')`,
      })
      .from(facilities);

    // Owners
    const [ownerStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${owners.status} = 'active')`,
        pending: sql<number>`count(*) filter (where ${owners.status} = 'pending_verification')`,
      })
      .from(owners);

    // Residents (if table exists)
    let residentStats = { total: 0 };
    try {
      const [rs] = await db
        .select({ total: sql<number>`count(*)` })
        .from(residents);
      residentStats = { total: Number(rs?.total || 0) };
    } catch (e) {
      // Table may not exist or be empty
    }

    // Reviews
    const [reviewStats] = await db
      .select({
        total: sql<number>`count(*)`,
        avgRating: sql<number>`avg(rating)`,
      })
      .from(reviews);

    // Today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats] = await db
      .select({
        auditLogs: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, today));

    res.json(success({
      facilities: {
        total: Number(facilityStats.total),
        active: Number(facilityStats.active),
        verified: Number(facilityStats.verified),
        pending: Number(facilityStats.pending),
      },
      owners: {
        total: Number(ownerStats.total),
        active: Number(ownerStats.active),
        pending: Number(ownerStats.pending),
      },
      residents: residentStats,
      reviews: {
        total: Number(reviewStats.total),
        avgRating: parseFloat(String(reviewStats.avgRating || 0)).toFixed(2),
      },
      today: {
        auditLogs: Number(todayStats.auditLogs),
      },
    }));
  } catch (err) {
    console.error("Get overview stats error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to get stats"));
  }
});

// System health
adminStatsRouter.get("/health", async (req, res) => {
  try {
    const start = Date.now();

    // Database check
    await db.select({ one: sql`1` }).from(facilities).limit(1);
    const dbLatency = Date.now() - start;

    res.json(success({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        latencyMs: dbLatency,
      },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: "MB",
      },
      uptime: {
        seconds: Math.round(process.uptime()),
        formatted: formatUptime(process.uptime()),
      },
    }));
  } catch (err) {
    console.error("Health check error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Health check failed"));
  }
});

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "< 1m";
}
