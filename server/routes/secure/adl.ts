import { Router } from "express";
import { db } from "../../db";
import { adlLogs } from "@shared/schema";
import { eq, and, desc, isNull, sql, gte, lte } from "drizzle-orm";
import { success, paginated, error } from "../../utils/responses";
import { requirePermission } from "../../middleware/permissions";
import { logPHIAccess } from "../../middleware/audit";
import { logger } from "../../utils/logger";

export const adlRouter = Router();

// Create ADL log entry
adlRouter.post("/",
  requirePermission("ehr:adl:write"),
  async (req: any, res) => {
    try {
      const facilityId = req.facilityScope;
      const staffAuth = req.session?.staffAuth;

      if (!facilityId) {
        return res.status(403).json(error("PERMISSION_DENIED", "No facility access"));
      }

      const {
        residentId,
        logDate,
        shiftType,
        // ADL Categories
        bathing,
        dressing,
        grooming,
        toileting,
        transferring,
        mobility,
        eating,
        // Additional
        continence,
        sleepQuality,
        moodBehavior,
        painLevel,
        // Vitals
        bloodPressureSystolic,
        bloodPressureDiastolic,
        pulse,
        temperature,
        weight,
        // Notes
        notes,
      } = req.body;

      if (!residentId || !logDate) {
        return res.status(400).json(error("VALIDATION_FAILED", "Resident ID and log date required"));
      }

      const recordedBy = staffAuth?.id || req.user?.id || "unknown";

      const [adlLog] = await db.insert(adlLogs).values({
        residentId,
        facilityId,
        logDate,
        shiftType,
        bathing,
        dressing,
        grooming,
        toileting,
        transferring,
        mobility,
        eating,
        continence,
        sleepQuality,
        moodBehavior,
        painLevel,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        pulse,
        temperature,
        weight,
        notes,
        recordedBy,
      }).returning();

      await logPHIAccess(req, {
        action: "create",
        resourceType: "adl_log",
        resourceId: adlLog.id.toString(),
        description: `Created ADL log for resident ${residentId}`,
      });

      logger.info({ adlLogId: adlLog.id, residentId, facilityId }, "ADL log created");

      res.status(201).json(success(adlLog));
    } catch (err) {
      console.error("Create ADL log error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to create ADL log"));
    }
  }
);

// Get ADL logs for resident
adlRouter.get("/resident/:residentId",
  requirePermission("ehr:adl:read"),
  async (req: any, res) => {
    try {
      const { residentId } = req.params;
      const facilityId = req.facilityScope;
      const { startDate, endDate, page = "1", limit = "20" } = req.query;

      if (!facilityId) {
        return res.status(403).json(error("PERMISSION_DENIED", "No facility access"));
      }

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100);
      const offset = (pageNum - 1) * limitNum;

      // Build conditions
      const conditions = [
        eq(adlLogs.residentId, residentId),
        eq(adlLogs.facilityId, facilityId),
        isNull(adlLogs.deletedAt),
      ];

      if (startDate) {
        conditions.push(gte(adlLogs.logDate, startDate as string));
      }
      if (endDate) {
        conditions.push(lte(adlLogs.logDate, endDate as string));
      }

      const logs = await db
        .select()
        .from(adlLogs)
        .where(and(...conditions))
        .orderBy(desc(adlLogs.logDate), desc(adlLogs.recordedAt))
        .limit(limitNum)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adlLogs)
        .where(and(...conditions));

      await logPHIAccess(req, {
        action: "view",
        resourceType: "adl_log",
        description: `Viewed ADL logs for resident ${residentId}`,
      });

      res.json(paginated(logs, pageNum, limitNum, Number(count)));
    } catch (err) {
      console.error("Get ADL logs error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to get ADL logs"));
    }
  }
);

// Get single ADL log
adlRouter.get("/:id",
  requirePermission("ehr:adl:read"),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const facilityId = req.facilityScope;

      const [adlLog] = await db
        .select()
        .from(adlLogs)
        .where(and(
          eq(adlLogs.id, parseInt(id)),
          eq(adlLogs.facilityId, facilityId),
          isNull(adlLogs.deletedAt)
        ));

      if (!adlLog) {
        return res.status(404).json(error("NOT_FOUND", "ADL log not found"));
      }

      await logPHIAccess(req, {
        action: "view",
        resourceType: "adl_log",
        resourceId: id,
      });

      res.json(success(adlLog));
    } catch (err) {
      console.error("Get ADL log error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to get ADL log"));
    }
  }
);

// Update ADL log
adlRouter.patch("/:id",
  requirePermission("ehr:adl:write"),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const facilityId = req.facilityScope;
      const updates = req.body;

      // Get current state for audit
      const [before] = await db
        .select()
        .from(adlLogs)
        .where(and(
          eq(adlLogs.id, parseInt(id)),
          eq(adlLogs.facilityId, facilityId),
          isNull(adlLogs.deletedAt)
        ));

      if (!before) {
        return res.status(404).json(error("NOT_FOUND", "ADL log not found"));
      }

      // Don't allow changing residentId or facilityId
      delete updates.residentId;
      delete updates.facilityId;
      delete updates.id;
      delete updates.recordedBy;
      delete updates.recordedAt;
      delete updates.deletedAt;

      const [updated] = await db
        .update(adlLogs)
        .set(updates)
        .where(eq(adlLogs.id, parseInt(id)))
        .returning();

      await logPHIAccess(req, {
        action: "update",
        resourceType: "adl_log",
        resourceId: id,
        previousValues: before,
        newValues: updated,
      });

      res.json(success(updated));
    } catch (err) {
      console.error("Update ADL log error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to update ADL log"));
    }
  }
);

// Soft delete ADL log
adlRouter.delete("/:id",
  requirePermission("ehr:adl:write"),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const facilityId = req.facilityScope;

      const [adlLog] = await db
        .select()
        .from(adlLogs)
        .where(and(
          eq(adlLogs.id, parseInt(id)),
          eq(adlLogs.facilityId, facilityId),
          isNull(adlLogs.deletedAt)
        ));

      if (!adlLog) {
        return res.status(404).json(error("NOT_FOUND", "ADL log not found"));
      }

      // Soft delete
      await db
        .update(adlLogs)
        .set({ deletedAt: new Date() })
        .where(eq(adlLogs.id, parseInt(id)));

      await logPHIAccess(req, {
        action: "delete",
        resourceType: "adl_log",
        resourceId: id,
        description: `Soft deleted ADL log for resident ${adlLog.residentId}`,
      });

      res.json(success({ deleted: true }));
    } catch (err) {
      console.error("Delete ADL log error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to delete ADL log"));
    }
  }
);

// Get daily summary for facility
adlRouter.get("/summary/daily",
  requirePermission("ehr:adl:read"),
  async (req: any, res) => {
    try {
      const facilityId = req.facilityScope;
      const { date } = req.query;

      if (!facilityId) {
        return res.status(403).json(error("PERMISSION_DENIED", "No facility access"));
      }

      const targetDate = date || new Date().toISOString().split("T")[0];

      // Get all ADL logs for the day
      const logs = await db
        .select()
        .from(adlLogs)
        .where(and(
          eq(adlLogs.facilityId, facilityId),
          eq(adlLogs.logDate, targetDate),
          isNull(adlLogs.deletedAt)
        ))
        .orderBy(adlLogs.residentId, adlLogs.shiftType);

      // Group by resident
      const byResident = logs.reduce((acc: any, log) => {
        if (!acc[log.residentId]) {
          acc[log.residentId] = [];
        }
        acc[log.residentId].push(log);
        return acc;
      }, {});

      res.json(success({
        date: targetDate,
        facilityId,
        totalLogs: logs.length,
        residentsWithLogs: Object.keys(byResident).length,
        byResident,
      }));
    } catch (err) {
      console.error("Get daily summary error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to get daily summary"));
    }
  }
);
