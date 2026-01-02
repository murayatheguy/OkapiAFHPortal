/**
 * Admin Routes
 *
 * Separate authentication and management system for administrators.
 * Includes impersonation capability for supporting facility owners.
 */

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db";
import {
  admins,
  adminAuditLog,
  facilities,
  owners,
  listingDefaults,
  facilityFieldOverrides,
} from "@shared/schema";
import { eq, and, like, or, sql, desc, asc, inArray } from "drizzle-orm";
import { requireAdminAuth, requireSuperAdmin } from "../middleware/facility-scope";
import { storage } from "../storage";

const router = Router();

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

/**
 * POST /api/admin/login
 * Admin login - separate from owner login
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const admin = await db.query.admins.findFirst({
      where: eq(admins.email, email.toLowerCase().trim()),
    });

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await db
      .update(admins)
      .set({ lastLoginAt: new Date() })
      .where(eq(admins.id, admin.id));

    // Set admin session
    req.session.adminId = admin.id;
    req.session.adminRole = admin.role as "admin" | "super_admin";
    req.session.impersonatedFacilityId = null;

    // Log the login
    await db.insert(adminAuditLog).values({
      adminId: admin.id,
      action: "login",
      ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || null,
      userAgent: req.headers["user-agent"] || null,
    });

    // Return admin data (without password hash)
    const { passwordHash: _, ...adminData } = admin;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Login failed - session error" });
      }
      res.json({ admin: adminData });
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/admin/logout
 * Admin logout
 */
router.post("/logout", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const adminId = req.session.adminId!;

    // Log the logout
    await db.insert(adminAuditLog).values({
      adminId,
      action: "logout",
      ipAddress: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
    });

    // Clear admin session
    req.session.adminId = null;
    req.session.adminRole = null;
    req.session.impersonatedFacilityId = null;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
      }
      res.json({ ok: true });
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

/**
 * GET /api/admin/me
 * Get current admin info
 */
router.get("/me", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, req.session.adminId!),
    });

    if (!admin) {
      req.session.adminId = null;
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { passwordHash: _, ...adminData } = admin;

    // Include impersonation info
    let impersonatedFacility = null;
    if (req.session.impersonatedFacilityId) {
      const fac = await db.query.facilities.findFirst({
        where: eq(facilities.id, req.session.impersonatedFacilityId),
        columns: { id: true, name: true, city: true },
        with: {
          owner: {
            columns: { name: true },
          },
        },
      });
      if (fac) {
        impersonatedFacility = {
          id: fac.id,
          name: fac.name,
          city: fac.city,
          ownerName: fac.owner?.name || null,
        };
      }
    }

    res.json({
      ...adminData,
      impersonatedFacility,
    });
  } catch (error) {
    console.error("Get admin error:", error);
    res.status(500).json({ error: "Failed to get admin data" });
  }
});

// ============================================================================
// IMPERSONATION
// ============================================================================

/**
 * POST /api/admin/impersonate
 * Start impersonating a facility
 */
router.post("/impersonate", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.body;
    const adminId = req.session.adminId!;

    if (!facilityId) {
      return res.status(400).json({ error: "facilityId required" });
    }

    // Check if admin can impersonate
    const admin = await db.query.admins.findFirst({
      where: eq(admins.id, adminId),
    });

    if (!admin?.canImpersonate) {
      return res.status(403).json({ error: "Impersonation not allowed for this admin" });
    }

    // Verify facility exists
    const facility = await db.query.facilities.findFirst({
      where: eq(facilities.id, facilityId),
      with: {
        owner: {
          columns: { name: true },
        },
      },
    });

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    // Set impersonation
    req.session.impersonatedFacilityId = facilityId;

    // Log the impersonation
    await db.insert(adminAuditLog).values({
      adminId,
      action: "impersonate_start",
      targetType: "facility",
      targetId: facilityId,
      metadata: {
        facilityName: facility.name,
        ownerName: facility.owner?.name,
      },
      ipAddress: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
    });

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Impersonation failed" });
      }
      res.json({
        ok: true,
        facility: {
          id: facility.id,
          name: facility.name,
          ownerName: facility.owner?.name || null,
        },
      });
    });
  } catch (error) {
    console.error("Impersonation error:", error);
    res.status(500).json({ error: "Impersonation failed" });
  }
});

/**
 * POST /api/admin/stop-impersonate
 * Stop impersonating
 */
router.post("/stop-impersonate", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const adminId = req.session.adminId!;
    const previousFacilityId = req.session.impersonatedFacilityId;

    // Log the stop
    if (previousFacilityId) {
      await db.insert(adminAuditLog).values({
        adminId,
        action: "impersonate_stop",
        targetType: "facility",
        targetId: previousFacilityId,
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null,
      });
    }

    // Clear impersonation
    req.session.impersonatedFacilityId = null;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
      }
      res.json({ ok: true });
    });
  } catch (error) {
    console.error("Stop impersonation error:", error);
    res.status(500).json({ error: "Failed to stop impersonation" });
  }
});

// ============================================================================
// FACILITY MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/facilities
 * List all facilities with pagination and filters
 */
router.get("/facilities", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = (req.query.search as string) || "";
    const claimStatus = req.query.claimStatus as string;
    const city = req.query.city as string;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(facilities.name, `%${search}%`),
          like(facilities.licenseNumber, `%${search}%`),
          like(facilities.city, `%${search}%`)
        )
      );
    }

    if (claimStatus) {
      conditions.push(eq(facilities.claimStatus, claimStatus));
    }

    if (city) {
      conditions.push(eq(facilities.city, city));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(facilities)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated facilities
    const facilityList = await db
      .select({
        id: facilities.id,
        name: facilities.name,
        city: facilities.city,
        state: facilities.state,
        licenseNumber: facilities.licenseNumber,
        licenseStatus: facilities.licenseStatus,
        claimStatus: facilities.claimStatus,
        status: facilities.status,
        ownerId: facilities.ownerId,
        capacity: facilities.capacity,
        availableBeds: facilities.availableBeds,
        createdAt: facilities.createdAt,
      })
      .from(facilities)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(facilities.name))
      .limit(limit)
      .offset(offset);

    // Get owner names for claimed facilities
    const ownerIds = facilityList
      .filter((f) => f.ownerId)
      .map((f) => f.ownerId as string);

    let ownerMap: Record<string, string> = {};
    if (ownerIds.length > 0) {
      const ownerList = await db
        .select({ id: owners.id, name: owners.name })
        .from(owners)
        .where(inArray(owners.id, ownerIds));

      ownerMap = Object.fromEntries(ownerList.map((o) => [o.id, o.name]));
    }

    const facilitiesWithOwners = facilityList.map((f) => ({
      ...f,
      ownerName: f.ownerId ? ownerMap[f.ownerId] || null : null,
    }));

    res.json({
      facilities: facilitiesWithOwners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get facilities error:", error);
    res.status(500).json({ error: "Failed to get facilities" });
  }
});

/**
 * GET /api/admin/facilities/:facilityId
 * Get single facility details
 */
router.get("/facilities/:facilityId", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;

    const facility = await db.query.facilities.findFirst({
      where: eq(facilities.id, facilityId),
      with: {
        owner: true,
      },
    });

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    res.json(facility);
  } catch (error) {
    console.error("Get facility error:", error);
    res.status(500).json({ error: "Failed to get facility" });
  }
});

/**
 * PATCH /api/admin/facilities/:facilityId
 * Update a facility (admin can update any facility)
 */
router.patch("/facilities/:facilityId", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;
    const adminId = req.session.adminId!;
    const updates = req.body;

    const facility = await db.query.facilities.findFirst({
      where: eq(facilities.id, facilityId),
    });

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    // Update facility
    const [updated] = await db
      .update(facilities)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(facilities.id, facilityId))
      .returning();

    // Log the edit
    await db.insert(adminAuditLog).values({
      adminId,
      action: "edit_facility",
      targetType: "facility",
      targetId: facilityId,
      metadata: {
        facilityName: facility.name,
        fieldsUpdated: Object.keys(updates),
      },
      ipAddress: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
    });

    res.json(updated);
  } catch (error) {
    console.error("Update facility error:", error);
    res.status(500).json({ error: "Failed to update facility" });
  }
});

// ============================================================================
// OWNER MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/owners
 * List all owners with pagination
 */
router.get("/owners", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = (req.query.search as string) || "";
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(owners.name, `%${search}%`),
          like(owners.email, `%${search}%`)
        )
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(owners)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    // Get paginated owners
    const ownerList = await db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(owners.createdAt))
      .limit(limit)
      .offset(offset);

    // Get facility counts per owner
    const facilityCounts = await db
      .select({
        ownerId: facilities.ownerId,
        count: sql<number>`count(*)`,
      })
      .from(facilities)
      .where(
        inArray(
          facilities.ownerId,
          ownerList.map((o) => o.id)
        )
      )
      .groupBy(facilities.ownerId);

    const countMap = Object.fromEntries(
      facilityCounts.map((c) => [c.ownerId, Number(c.count)])
    );

    const ownersWithCounts = ownerList.map((o) => ({
      ...o,
      facilityCount: countMap[o.id] || 0,
    }));

    res.json({
      owners: ownersWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get owners error:", error);
    res.status(500).json({ error: "Failed to get owners" });
  }
});

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get("/stats", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    // Total facilities
    const [facilityCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(facilities);

    // Facilities by claim status
    const claimStats = await db
      .select({
        claimStatus: facilities.claimStatus,
        count: sql<number>`count(*)`,
      })
      .from(facilities)
      .groupBy(facilities.claimStatus);

    // Total owners
    const [ownerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(owners);

    // Active owners (logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeOwnerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(owners)
      .where(sql`${owners.lastLoginAt} > ${thirtyDaysAgo}`);

    // Recent admin activity
    const recentActivity = await db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(10);

    res.json({
      facilities: {
        total: Number(facilityCount.count),
        byClaimStatus: Object.fromEntries(
          claimStats.map((s) => [s.claimStatus, Number(s.count)])
        ),
      },
      owners: {
        total: Number(ownerCount.count),
        activeLastMonth: Number(activeOwnerCount.count),
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// ============================================================================
// LISTING DEFAULTS MANAGEMENT
// Defaults are applied AT RENDER TIME, not written to facility records
// Logic: effectiveValue = facility.fieldValue ?? listingDefaults.defaultFieldValue
// ============================================================================

/**
 * GET /api/admin/defaults
 * Get all listing defaults (applied at render time)
 */
router.get("/defaults", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const defaults = await db
      .select()
      .from(listingDefaults)
      .orderBy(asc(listingDefaults.fieldName));

    res.json(defaults);
  } catch (error) {
    console.error("Get defaults error:", error);
    res.status(500).json({ error: "Failed to get defaults" });
  }
});

/**
 * PUT /api/admin/defaults/:fieldName
 * Upsert a listing default value (applied at render time, not written to facilities)
 */
router.put("/defaults/:fieldName", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { fieldName } = req.params;
    const { value, description } = req.body;
    const adminId = req.session.adminId!;

    // Use storage method for upsert
    const result = await storage.setListingDefault(fieldName, value, description, adminId);

    // Log the action
    await db.insert(adminAuditLog).values({
      adminId,
      action: "update_listing_default",
      targetType: "listing_defaults",
      targetId: fieldName,
      metadata: { value, description },
      ipAddress: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
    });

    res.json(result);
  } catch (error) {
    console.error("Upsert default error:", error);
    res.status(500).json({ error: "Failed to save default" });
  }
});

/**
 * DELETE /api/admin/defaults/:fieldName
 * Delete a listing default
 */
router.delete("/defaults/:fieldName", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { fieldName } = req.params;
    const adminId = req.session.adminId!;

    await storage.deleteListingDefault(fieldName);

    // Log the action
    await db.insert(adminAuditLog).values({
      adminId,
      action: "delete_listing_default",
      targetType: "listing_defaults",
      targetId: fieldName,
      ipAddress: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Delete default error:", error);
    res.status(500).json({ error: "Failed to delete default" });
  }
});

/**
 * GET /api/admin/facility/:facilityId/overrides
 * Get which fields are customized vs using defaults for a facility
 * Note: This is informational - overrides tracking is optional and not actively used yet
 */
router.get("/facility/:facilityId/overrides", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.params;

    // Get all overrides for this facility
    const overrides = await db
      .select()
      .from(facilityFieldOverrides)
      .where(eq(facilityFieldOverrides.facilityId, facilityId));

    // Get all defaults
    const defaults = await db.select().from(listingDefaults);

    const overrideMap = new Map(overrides.map((o) => [o.fieldName, o]));

    const fieldStatus = defaults.map((d) => ({
      fieldName: d.fieldName,
      defaultValue: d.defaultValue,
      isCustomized: overrideMap.has(d.fieldName),
      customizedAt: overrideMap.get(d.fieldName)?.customizedAt || null,
      customizedBy: overrideMap.get(d.fieldName)?.customizedBy || null,
    }));

    res.json({
      facilityId,
      fields: fieldStatus,
      customizedCount: overrides.length,
      templateManagedCount: defaults.length - overrides.length,
    });
  } catch (error) {
    console.error("Get overrides error:", error);
    res.status(500).json({ error: "Failed to get overrides" });
  }
});

// ============================================================================
// TEMPLATE FACILITY MANAGEMENT
// ============================================================================

/**
 * Template-managed fields - these can be applied from the template facility
 * to other facilities when their values are NULL/empty
 */
const TEMPLATE_MANAGED_FIELDS = [
  "ownerBio",
  "carePhilosophy",
  "dailyRoutine",
  "uniqueFeatures",
  "amenities",
  "careTypes",
  "specialties",
  "acceptsMedicaid",
  "acceptsPrivatePay",
  "acceptsLTCInsurance",
  "acceptsVABenefits",
  "acceptingInquiries",
  "description",
] as const;

/**
 * Identity fields - NEVER overwritten by template
 */
const IDENTITY_FIELDS = [
  "id", "name", "slug", "address", "city", "state", "zipCode", "county",
  "licenseNumber", "licenseStatus", "phone", "email", "website",
  "ownerId", "claimStatus", "latitude", "longitude", "capacity",
  "availableBeds", "facilityPin", "googlePlaceId", "isDemo", "isTemplate",
] as const;

/**
 * GET /api/admin/template
 * Get the template facility and its values
 */
router.get("/template", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const template = await db.query.facilities.findFirst({
      where: eq(facilities.isTemplate, true),
    });

    if (!template) {
      return res.status(404).json({ error: "No template facility exists" });
    }

    // Extract only template-managed fields
    const templateValues: Record<string, any> = {};
    for (const field of TEMPLATE_MANAGED_FIELDS) {
      templateValues[field] = (template as any)[field];
    }

    res.json({
      templateId: template.id,
      templateName: template.name,
      templateValues,
      managedFields: TEMPLATE_MANAGED_FIELDS,
      identityFields: IDENTITY_FIELDS,
    });
  } catch (error) {
    console.error("Get template error:", error);
    res.status(500).json({ error: "Failed to get template" });
  }
});

/**
 * POST /api/admin/template/apply
 * Apply template values to facilities ONLY for fields that are NULL/empty
 *
 * Body options:
 * - facilityIds: string[] - specific facilities to update (optional, defaults to all non-template facilities)
 * - dryRun: boolean - if true, returns what would be updated without making changes
 * - fields: string[] - specific fields to apply (optional, defaults to all template-managed fields)
 */
router.post("/template/apply", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const adminId = req.session.adminId!;
    const { facilityIds, dryRun = false, fields } = req.body;

    // Get template facility
    const template = await db.query.facilities.findFirst({
      where: eq(facilities.isTemplate, true),
    });

    if (!template) {
      return res.status(404).json({ error: "No template facility exists" });
    }

    // Determine which fields to apply
    const fieldsToApply = fields
      ? TEMPLATE_MANAGED_FIELDS.filter(f => fields.includes(f))
      : [...TEMPLATE_MANAGED_FIELDS];

    // Get target facilities
    let targetFacilities;
    if (facilityIds && Array.isArray(facilityIds) && facilityIds.length > 0) {
      targetFacilities = await db
        .select()
        .from(facilities)
        .where(
          and(
            inArray(facilities.id, facilityIds),
            eq(facilities.isTemplate, false)
          )
        );
    } else {
      // All non-template facilities
      targetFacilities = await db
        .select()
        .from(facilities)
        .where(eq(facilities.isTemplate, false));
    }

    const results: Array<{
      facilityId: string;
      facilityName: string;
      fieldsUpdated: string[];
    }> = [];

    for (const facility of targetFacilities) {
      const updates: Record<string, any> = {};
      const fieldsUpdated: string[] = [];

      for (const field of fieldsToApply) {
        const currentValue = (facility as any)[field];
        const templateValue = (template as any)[field];

        // Only apply if current value is null/undefined/empty and template has a value
        const isEmpty = currentValue === null ||
                       currentValue === undefined ||
                       currentValue === "" ||
                       (Array.isArray(currentValue) && currentValue.length === 0);

        const templateHasValue = templateValue !== null &&
                                 templateValue !== undefined &&
                                 templateValue !== "" &&
                                 !(Array.isArray(templateValue) && templateValue.length === 0);

        if (isEmpty && templateHasValue) {
          updates[field] = templateValue;
          fieldsUpdated.push(field);
        }
      }

      if (fieldsUpdated.length > 0) {
        if (!dryRun) {
          // Apply updates
          await db
            .update(facilities)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(facilities.id, facility.id));
        }

        results.push({
          facilityId: facility.id,
          facilityName: facility.name,
          fieldsUpdated,
        });
      }
    }

    // Log the action
    if (!dryRun && results.length > 0) {
      await db.insert(adminAuditLog).values({
        adminId,
        action: "apply_template",
        targetType: "facilities",
        metadata: {
          templateId: template.id,
          facilitiesUpdated: results.length,
          fieldsApplied: fieldsToApply,
          dryRun,
        },
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null,
      });
    }

    res.json({
      success: true,
      dryRun,
      templateId: template.id,
      templateName: template.name,
      totalFacilitiesScanned: targetFacilities.length,
      facilitiesUpdated: results.length,
      fieldsApplied: fieldsToApply,
      results,
    });
  } catch (error) {
    console.error("Apply template error:", error);
    res.status(500).json({ error: "Failed to apply template" });
  }
});

/**
 * PATCH /api/admin/template
 * Update template facility values
 */
router.patch("/template", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const adminId = req.session.adminId!;
    const updates = req.body;

    // Get template facility
    const template = await db.query.facilities.findFirst({
      where: eq(facilities.isTemplate, true),
    });

    if (!template) {
      return res.status(404).json({ error: "No template facility exists" });
    }

    // Only allow updating template-managed fields
    const allowedUpdates: Record<string, any> = {};
    const rejectedFields: string[] = [];

    for (const [field, value] of Object.entries(updates)) {
      if (TEMPLATE_MANAGED_FIELDS.includes(field as any)) {
        allowedUpdates[field] = value;
      } else if (!["id", "isTemplate"].includes(field)) {
        rejectedFields.push(field);
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        error: "No valid template fields to update",
        rejectedFields,
        allowedFields: TEMPLATE_MANAGED_FIELDS,
      });
    }

    // Update template
    const [updated] = await db
      .update(facilities)
      .set({ ...allowedUpdates, updatedAt: new Date() })
      .where(eq(facilities.id, template.id))
      .returning();

    // Log the action
    await db.insert(adminAuditLog).values({
      adminId,
      action: "update_template",
      targetType: "facility",
      targetId: template.id,
      metadata: {
        fieldsUpdated: Object.keys(allowedUpdates),
        rejectedFields,
      },
      ipAddress: req.ip || null,
      userAgent: req.headers["user-agent"] || null,
    });

    res.json({
      success: true,
      templateId: updated.id,
      fieldsUpdated: Object.keys(allowedUpdates),
      rejectedFields: rejectedFields.length > 0 ? rejectedFields : undefined,
    });
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

// ============================================================================
// ADMIN MANAGEMENT (Super Admin Only)
// ============================================================================

/**
 * GET /api/admin/admins
 * List all admins (super_admin only)
 */
router.get("/admins", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const adminList = await db
      .select({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        canImpersonate: admins.canImpersonate,
        createdAt: admins.createdAt,
        lastLoginAt: admins.lastLoginAt,
      })
      .from(admins)
      .orderBy(desc(admins.createdAt));

    res.json(adminList);
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({ error: "Failed to get admins" });
  }
});

/**
 * POST /api/admin/admins
 * Create a new admin (super_admin only)
 */
router.post("/admins", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, canImpersonate } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name required" });
    }

    // Check if email already exists
    const existing = await db.query.admins.findFirst({
      where: eq(admins.email, email.toLowerCase().trim()),
    });

    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newAdmin] = await db
      .insert(admins)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        role: role || "admin",
        canImpersonate: canImpersonate !== false,
      })
      .returning();

    const { passwordHash: _, ...adminData } = newAdmin;
    res.status(201).json(adminData);
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ error: "Failed to create admin" });
  }
});

/**
 * GET /api/admin/audit-log
 * Get admin audit log
 */
router.get("/audit-log", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const logs = await db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Get admin names
    const adminIds = Array.from(new Set(logs.map((l) => l.adminId)));
    const adminList = await db
      .select({ id: admins.id, name: admins.name })
      .from(admins)
      .where(inArray(admins.id, adminIds));

    const adminMap = Object.fromEntries(adminList.map((a) => [a.id, a.name]));

    const logsWithAdminNames = logs.map((l) => ({
      ...l,
      adminName: adminMap[l.adminId] || "Unknown",
    }));

    res.json(logsWithAdminNames);
  } catch (error) {
    console.error("Get audit log error:", error);
    res.status(500).json({ error: "Failed to get audit log" });
  }
});

// Named export for consistency with other route files
export { router as adminRoutes };
export default router;
