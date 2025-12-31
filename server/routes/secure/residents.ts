import { Router } from "express";
import { db } from "../../db";
import { residents } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import { success, error } from "../../utils/responses";
import { requirePermission } from "../../middleware/permissions";
import { auditMiddleware, logPHIAccess } from "../../middleware/audit";

export const residentsRouter = Router();

// List residents (scoped to facility)
residentsRouter.get("/",
  requirePermission("resident:list"),
  auditMiddleware("resident"),
  async (req: any, res) => {
    try {
      const facilityId = req.facilityScope;

      if (!facilityId) {
        return res.status(403).json(error("PERMISSION_DENIED", "No facility access"));
      }

      const result = await db
        .select()
        .from(residents)
        .where(and(
          eq(residents.facilityId, facilityId),
          isNull(residents.deletedAt)
        ));

      res.json(success(result));
    } catch (err) {
      console.error("List residents error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to fetch residents"));
    }
  }
);

// Get single resident
residentsRouter.get("/:id",
  requirePermission("resident:read"),
  auditMiddleware("resident"),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const facilityId = req.facilityScope;

      const [resident] = await db
        .select()
        .from(residents)
        .where(and(
          eq(residents.id, id),
          eq(residents.facilityId, facilityId),
          isNull(residents.deletedAt)
        ));

      if (!resident) {
        return res.status(404).json(error("NOT_FOUND", "Resident not found"));
      }

      res.json(success(resident));
    } catch (err) {
      console.error("Get resident error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to fetch resident"));
    }
  }
);

// Create resident
residentsRouter.post("/",
  requirePermission("resident:create"),
  async (req: any, res) => {
    try {
      const facilityId = req.facilityScope;
      const data = req.body;

      const [resident] = await db
        .insert(residents)
        .values({
          ...data,
          facilityId,
        })
        .returning();

      // Log PHI access
      await logPHIAccess(req, {
        action: "create",
        resourceType: "resident",
        resourceId: resident.id,
        description: `Created resident ${data.firstName} ${data.lastName}`,
      });

      res.status(201).json(success(resident));
    } catch (err) {
      console.error("Create resident error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to create resident"));
    }
  }
);

// Update resident
residentsRouter.patch("/:id",
  requirePermission("resident:edit"),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const facilityId = req.facilityScope;
      const data = req.body;

      // Get current state for audit
      const [before] = await db
        .select()
        .from(residents)
        .where(and(
          eq(residents.id, id),
          eq(residents.facilityId, facilityId)
        ));

      if (!before) {
        return res.status(404).json(error("NOT_FOUND", "Resident not found"));
      }

      const [updated] = await db
        .update(residents)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(
          eq(residents.id, id),
          eq(residents.facilityId, facilityId)
        ))
        .returning();

      // Log with before/after
      await logPHIAccess(req, {
        action: "update",
        resourceType: "resident",
        resourceId: id,
        previousValues: before,
        newValues: updated,
      });

      res.json(success(updated));
    } catch (err) {
      console.error("Update resident error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to update resident"));
    }
  }
);
