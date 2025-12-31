import { Router } from "express";
import { db } from "../../db";
import { auditLogs } from "@shared/schema";
import { eq, desc, sql, gte, lte, and, ilike, or } from "drizzle-orm";
import { success, paginated, error } from "../../utils/responses";

export const adminAuditRouter = Router();

// Get audit logs
adminAuditRouter.get("/", async (req, res) => {
  try {
    const {
      userId,
      facilityId,
      action,
      resourceType,
      isSecurityEvent,
      startDate,
      endDate,
      search,
      page = "1",
      limit = "50",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 200);
    const offset = (pageNum - 1) * limitNum;

    // Build conditions
    const conditions = [];

    if (userId) conditions.push(eq(auditLogs.userId, userId as string));
    if (facilityId) conditions.push(eq(auditLogs.facilityId, facilityId as string));
    if (action) conditions.push(eq(auditLogs.action, action as string));
    if (resourceType) conditions.push(eq(auditLogs.resourceType, resourceType as string));
    if (isSecurityEvent === "true") conditions.push(eq(auditLogs.isSecurityEvent, true));
    if (startDate) conditions.push(gte(auditLogs.createdAt, new Date(startDate as string)));
    if (endDate) conditions.push(lte(auditLogs.createdAt, new Date(endDate as string)));
    if (search) {
      conditions.push(
        or(
          ilike(auditLogs.description, `%${search}%`),
          ilike(auditLogs.userEmail, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    res.json(paginated(logs, pageNum, limitNum, Number(count)));
  } catch (err) {
    console.error("Get audit logs error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to get audit logs"));
  }
});

// Get security events
adminAuditRouter.get("/security", async (req, res) => {
  try {
    const { startDate, endDate, page = "1", limit = "50" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 200);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [eq(auditLogs.isSecurityEvent, true)];

    if (startDate) conditions.push(gte(auditLogs.createdAt, new Date(startDate as string)));
    if (endDate) conditions.push(lte(auditLogs.createdAt, new Date(endDate as string)));

    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(...conditions));

    res.json(paginated(logs, pageNum, limitNum, Number(count)));
  } catch (err) {
    console.error("Get security events error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to get security events"));
  }
});

// Get audit summary/stats
adminAuditRouter.get("/stats", async (req, res) => {
  try {
    const { days = "7" } = req.query;
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Total logs
    const [{ totalLogs }] = await db
      .select({ totalLogs: sql<number>`count(*)` })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, startDate));

    // Security events
    const [{ securityEvents }] = await db
      .select({ securityEvents: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(
        gte(auditLogs.createdAt, startDate),
        eq(auditLogs.isSecurityEvent, true)
      ));

    // By action type
    const byAction = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, startDate))
      .groupBy(auditLogs.action);

    // By resource type
    const byResource = await db
      .select({
        resourceType: auditLogs.resourceType,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, startDate))
      .groupBy(auditLogs.resourceType);

    res.json(success({
      period: { days: daysNum, startDate },
      totalLogs: Number(totalLogs),
      securityEvents: Number(securityEvents),
      byAction: byAction.map(a => ({ action: a.action, count: Number(a.count) })),
      byResource: byResource.map(r => ({ resourceType: r.resourceType, count: Number(r.count) })),
    }));
  } catch (err) {
    console.error("Get audit stats error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to get audit stats"));
  }
});
