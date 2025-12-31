import { Router } from "express";
import { db } from "../../db";
import { facilities, facilityCompliance, owners } from "@shared/schema";
import { eq, desc, sql, ilike, or, and } from "drizzle-orm";
import { success, paginated, error } from "../../utils/responses";
import { logPHIAccess } from "../../middleware/audit";
import { recalculateAllScores } from "../../services/careScore";

export const adminFacilitiesRouter = Router();

// List all facilities (with filters)
adminFacilitiesRouter.get("/", async (req: any, res) => {
  try {
    const {
      status,
      search,
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    // Build conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(facilities.status, status as string));
    }

    if (search) {
      conditions.push(
        or(
          ilike(facilities.name, `%${search}%`),
          ilike(facilities.city, `%${search}%`),
          ilike(facilities.email, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        slug: facilities.slug,
        city: facilities.city,
        state: facilities.state,
        status: facilities.status,
        claimStatus: facilities.claimStatus,
        ownerId: facilities.ownerId,
        email: facilities.email,
        phone: facilities.phone,
        capacity: facilities.capacity,
        createdAt: facilities.createdAt,
        updatedAt: facilities.updatedAt,
      })
      .from(facilities)
      .where(whereClause)
      .orderBy(sortOrder === "asc" ? facilities.createdAt : desc(facilities.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(facilities)
      .where(whereClause);

    res.json(paginated(results, pageNum, limitNum, Number(count)));
  } catch (err) {
    console.error("Admin list facilities error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to list facilities"));
  }
});

// Get facility details (admin view)
adminFacilitiesRouter.get("/:id", async (req: any, res) => {
  try {
    const { id } = req.params;

    const [facility] = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, id));

    if (!facility) {
      return res.status(404).json(error("NOT_FOUND", "Facility not found"));
    }

    // Get compliance data
    const [compliance] = await db
      .select()
      .from(facilityCompliance)
      .where(eq(facilityCompliance.facilityId, id));

    // Get owner info
    let owner = null;
    if (facility.ownerId) {
      const [ownerData] = await db
        .select({
          id: owners.id,
          email: owners.email,
          name: owners.name,
          phone: owners.phone,
          status: owners.status,
        })
        .from(owners)
        .where(eq(owners.id, facility.ownerId));
      owner = ownerData;
    }

    await logPHIAccess(req, {
      action: "view",
      resourceType: "facility",
      resourceId: id,
      description: "Admin viewed facility details",
    });

    res.json(success({
      facility,
      compliance,
      owner,
    }));
  } catch (err) {
    console.error("Admin get facility error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to get facility"));
  }
});

// Update facility status
adminFacilitiesRouter.patch("/:id/status", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, claimStatus, reason } = req.body;

    const [before] = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, id));

    if (!before) {
      return res.status(404).json(error("NOT_FOUND", "Facility not found"));
    }

    const updates: any = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status;
    if (claimStatus !== undefined) updates.claimStatus = claimStatus;

    const [updated] = await db
      .update(facilities)
      .set(updates)
      .where(eq(facilities.id, id))
      .returning();

    await logPHIAccess(req, {
      action: "update",
      resourceType: "facility",
      resourceId: id,
      description: `Admin updated facility status: ${reason || "No reason provided"}`,
      previousValues: { status: before.status, claimStatus: before.claimStatus },
      newValues: updates,
    });

    res.json(success(updated));
  } catch (err) {
    console.error("Admin update facility status error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to update facility"));
  }
});

// Verify facility
adminFacilitiesRouter.post("/:id/verify", async (req: any, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const [facility] = await db
      .update(facilities)
      .set({
        claimStatus: "verified",
        updatedAt: new Date()
      })
      .where(eq(facilities.id, id))
      .returning();

    if (!facility) {
      return res.status(404).json(error("NOT_FOUND", "Facility not found"));
    }

    // Update compliance record if exists
    await db.update(facilityCompliance)
      .set({
        isVerified: true,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(facilityCompliance.facilityId, id));

    await logPHIAccess(req, {
      action: "update",
      resourceType: "facility",
      resourceId: id,
      description: "Admin verified facility",
    });

    res.json(success({ verified: true, facility }));
  } catch (err) {
    console.error("Admin verify facility error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to verify facility"));
  }
});

// Batch recalculate all care scores
adminFacilitiesRouter.post("/recalculate-scores", async (req: any, res) => {
  try {
    const result = await recalculateAllScores();

    await logPHIAccess(req, {
      action: "update",
      resourceType: "facility",
      description: `Admin triggered batch score recalculation: ${result.updated} updated, ${result.errors} errors`,
    });

    res.json(success(result));
  } catch (err) {
    console.error("Batch recalculate error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to recalculate scores"));
  }
});
