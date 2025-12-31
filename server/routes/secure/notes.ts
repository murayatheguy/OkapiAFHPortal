import { Router } from "express";
import { db } from "../../db";
import { sql } from "drizzle-orm";
import { success, error } from "../../utils/responses";
import { requirePermission } from "../../middleware/permissions";
import { logPHIAccess } from "../../middleware/audit";

export const notesRouter = Router();

// Note: Full implementation requires care_notes table in schema
// This provides the route structure for future implementation

// Create care note
notesRouter.post("/",
  requirePermission("ehr:notes:write"),
  async (req: any, res) => {
    try {
      const facilityId = req.facilityScope;
      const staffAuth = req.session?.staffAuth;

      const {
        residentId,
        noteType, // 'progress', 'incident', 'communication', 'behavior', 'health_change'
        content,
        isUrgent,
        notifyOwner,
      } = req.body;

      if (!residentId || !content) {
        return res.status(400).json(error("VALIDATION_FAILED", "Resident ID and content required"));
      }

      // TODO: Insert into care_notes table when available
      const noteData = {
        facilityId,
        residentId,
        noteType: noteType || "progress",
        content,
        isUrgent: isUrgent || false,
        createdBy: staffAuth?.id || req.user?.id,
        createdAt: new Date(),
      };

      await logPHIAccess(req, {
        action: "create",
        resourceType: "care_note",
        description: `Created ${noteType || "progress"} note for resident ${residentId}`,
      });

      res.status(201).json(success({
        message: "Care note created",
        note: noteData,
      }));
    } catch (err) {
      console.error("Create care note error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to create note"));
    }
  }
);

// Get notes for resident
notesRouter.get("/resident/:residentId",
  requirePermission("ehr:notes:read"),
  async (req: any, res) => {
    try {
      const { residentId } = req.params;
      const facilityId = req.facilityScope;

      // TODO: Query care_notes table when available

      await logPHIAccess(req, {
        action: "view",
        resourceType: "care_note",
        description: `Viewed notes for resident ${residentId}`,
      });

      res.json(success({
        message: "Notes module ready - requires care_notes table schema",
        residentId,
        notes: [],
      }));
    } catch (err) {
      console.error("Get notes error:", err);
      res.status(500).json(error("INTERNAL_ERROR", "Failed to get notes"));
    }
  }
);
