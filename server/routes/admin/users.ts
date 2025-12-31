import { Router } from "express";
import { db } from "../../db";
import { owners, admins } from "@shared/schema";
import { eq, desc, sql, ilike, or, and } from "drizzle-orm";
import { success, paginated, error } from "../../utils/responses";
import { logPHIAccess } from "../../middleware/audit";

export const adminUsersRouter = Router();

// List all owners
adminUsersRouter.get("/owners", async (req, res) => {
  try {
    const {
      status,
      search,
      page = "1",
      limit = "20"
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (status) {
      conditions.push(eq(owners.status, status as string));
    }

    if (search) {
      conditions.push(
        or(
          ilike(owners.email, `%${search}%`),
          ilike(owners.name, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: owners.id,
        email: owners.email,
        name: owners.name,
        phone: owners.phone,
        status: owners.status,
        emailVerified: owners.emailVerified,
        createdAt: owners.createdAt,
        lastLoginAt: owners.lastLoginAt,
      })
      .from(owners)
      .where(whereClause)
      .orderBy(desc(owners.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(owners)
      .where(whereClause);

    res.json(paginated(results, pageNum, limitNum, Number(count)));
  } catch (err) {
    console.error("Admin list owners error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to list owners"));
  }
});

// Get owner details
adminUsersRouter.get("/owners/:id", async (req: any, res) => {
  try {
    const { id } = req.params;

    const [owner] = await db
      .select({
        id: owners.id,
        email: owners.email,
        name: owners.name,
        phone: owners.phone,
        status: owners.status,
        emailVerified: owners.emailVerified,
        createdAt: owners.createdAt,
        updatedAt: owners.updatedAt,
        lastLoginAt: owners.lastLoginAt,
      })
      .from(owners)
      .where(eq(owners.id, id));

    if (!owner) {
      return res.status(404).json(error("NOT_FOUND", "Owner not found"));
    }

    await logPHIAccess(req, {
      action: "view",
      resourceType: "owner",
      resourceId: id,
      description: "Admin viewed owner details",
    });

    res.json(success(owner));
  } catch (err) {
    console.error("Admin get owner error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to get owner"));
  }
});

// Update owner status
adminUsersRouter.patch("/owners/:id/status", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ["pending_verification", "active", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(error("VALIDATION_FAILED", "Invalid status"));
    }

    const [before] = await db
      .select()
      .from(owners)
      .where(eq(owners.id, id));

    if (!before) {
      return res.status(404).json(error("NOT_FOUND", "Owner not found"));
    }

    const [updated] = await db
      .update(owners)
      .set({ status, updatedAt: new Date() })
      .where(eq(owners.id, id))
      .returning();

    await logPHIAccess(req, {
      action: "update",
      resourceType: "owner",
      resourceId: id,
      description: `Admin changed owner status from ${before.status} to ${status}: ${reason || "No reason"}`,
      previousValues: { status: before.status },
      newValues: { status },
    });

    res.json(success(updated));
  } catch (err) {
    console.error("Admin update owner status error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to update owner"));
  }
});

// List all admins
adminUsersRouter.get("/admins", async (req, res) => {
  try {
    const { search, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(admins.email, `%${search}%`),
          ilike(admins.name, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        createdAt: admins.createdAt,
      })
      .from(admins)
      .where(whereClause)
      .orderBy(desc(admins.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(admins)
      .where(whereClause);

    res.json(paginated(results, pageNum, limitNum, Number(count)));
  } catch (err) {
    console.error("Admin list admins error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to list admins"));
  }
});

// Update admin role (super_admin only)
adminUsersRouter.patch("/admins/:id/role", async (req: any, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUser = req.user;

    // Only super_admin can change admin roles
    if (currentUser?.adminRole !== "super_admin") {
      return res.status(403).json(error("PERMISSION_DENIED", "Super admin access required"));
    }

    const validRoles = ["super_admin", "admin", "moderator"];
    if (!validRoles.includes(role)) {
      return res.status(400).json(error("VALIDATION_FAILED", "Invalid role"));
    }

    const [before] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, id));

    if (!before) {
      return res.status(404).json(error("NOT_FOUND", "Admin not found"));
    }

    const [updated] = await db
      .update(admins)
      .set({ role, updatedAt: new Date() })
      .where(eq(admins.id, id))
      .returning();

    await logPHIAccess(req, {
      action: "update",
      resourceType: "admin",
      resourceId: id,
      description: `Admin changed admin role from ${before.role} to ${role}`,
      previousValues: { role: before.role },
      newValues: { role },
    });

    res.json(success(updated));
  } catch (err) {
    console.error("Admin update admin role error:", err);
    res.status(500).json(error("INTERNAL_ERROR", "Failed to update admin"));
  }
});
