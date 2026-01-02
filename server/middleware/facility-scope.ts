/**
 * Facility Scope Enforcement Middleware
 *
 * This is the heart of multi-tenancy:
 * - Owners can only access their own facilities
 * - Admins can impersonate any facility
 * - All facility-scoped routes use resolveActiveFacilityId
 */

import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { facilities, admins } from "@shared/schema";
import { eq } from "drizzle-orm";

// Session types for type safety
export type OwnerSession = {
  ownerId: string;
};

export type AdminSession = {
  adminId: string;
  adminRole: "admin" | "super_admin";
  impersonatedFacilityId: string | null;
};

export type ResolvedSession = OwnerSession | AdminSession;

/**
 * Core access control function - resolves which facility the user is accessing
 *
 * Priority:
 * 1. Admin impersonation overrides everything
 * 2. Admin without impersonation can access any facility if explicitly requested
 * 3. Owner must own the facility and it must be claimed
 */
export async function resolveActiveFacilityId(
  session: Request["session"],
  requestedFacilityId?: string
): Promise<string> {
  // Admin impersonation overrides everything
  if (session.adminId && session.impersonatedFacilityId) {
    // Verify the impersonated facility still exists
    const fac = await db.query.facilities.findFirst({
      where: eq(facilities.id, session.impersonatedFacilityId),
      columns: { id: true },
    });
    if (!fac) throw new Error("Impersonated facility not found");
    return session.impersonatedFacilityId;
  }

  // Admin without impersonation can access any facility if explicitly requested
  if (session.adminId && requestedFacilityId) {
    const fac = await db.query.facilities.findFirst({
      where: eq(facilities.id, requestedFacilityId),
      columns: { id: true },
    });
    if (!fac) throw new Error("Facility not found");
    return fac.id;
  }

  // Owner must have a facility ID and must own it
  if (session.ownerId) {
    if (!requestedFacilityId) throw new Error("facilityId required");

    const fac = await db.query.facilities.findFirst({
      where: eq(facilities.id, requestedFacilityId),
      columns: { id: true, ownerId: true, claimStatus: true },
    });

    if (!fac) throw new Error("Facility not found");
    if (fac.ownerId !== session.ownerId) throw new Error("Forbidden");
    if (fac.claimStatus !== "claimed") throw new Error("Facility not claimed");

    return fac.id;
  }

  throw new Error("Invalid session");
}

/**
 * Middleware: Require owner authentication
 */
export function requireOwnerAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.ownerId) {
    return res.status(401).json({ error: "Unauthorized - Owner login required" });
  }
  next();
}

/**
 * Middleware: Require admin authentication
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    return res.status(401).json({ error: "Unauthorized - Admin login required" });
  }
  next();
}

/**
 * Middleware: Require either owner OR admin authentication
 * Use this for routes that admins can access when impersonating
 */
export function requireOwnerOrAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.ownerId && !req.session?.adminId) {
    return res.status(401).json({ error: "Unauthorized - Login required" });
  }
  next();
}

/**
 * Middleware: Require super_admin role
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    return res.status(401).json({ error: "Unauthorized - Admin login required" });
  }
  if (req.session.adminRole !== "super_admin") {
    return res.status(403).json({ error: "Forbidden - Super admin access required" });
  }
  next();
}

/**
 * Middleware: Require facility access (owner routes that admins can also access when impersonating)
 *
 * This allows both:
 * - Owners accessing their own facilities
 * - Admins impersonating or directly accessing facilities
 */
export async function requireFacilityAccess(req: Request, res: Response, next: NextFunction) {
  const session = req.session;

  // Must have either owner or admin session
  if (!session?.ownerId && !session?.adminId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Get facility ID from params or body
  const requestedFacilityId = req.params.facilityId || req.body?.facilityId;

  try {
    const resolvedFacilityId = await resolveActiveFacilityId(session, requestedFacilityId);

    // Attach resolved facility ID to request for use in route handlers
    (req as any).resolvedFacilityId = resolvedFacilityId;
    (req as any).isAdminAccess = !!session.adminId;
    (req as any).isImpersonating = !!(session.adminId && session.impersonatedFacilityId);

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access denied";

    if (message === "Facility not found" || message === "Impersonated facility not found") {
      return res.status(404).json({ error: message });
    }
    if (message === "Forbidden" || message === "Facility not claimed") {
      return res.status(403).json({ error: message });
    }
    if (message === "facilityId required") {
      return res.status(400).json({ error: message });
    }

    return res.status(401).json({ error: "Invalid session" });
  }
}

/**
 * Helper: Get admin info from session
 */
export async function getAdminFromSession(session: Request["session"]) {
  if (!session?.adminId) return null;

  const admin = await db.query.admins.findFirst({
    where: eq(admins.id, session.adminId),
  });

  return admin;
}

/**
 * Helper: Check if current session is admin impersonating
 */
export function isAdminImpersonating(session: Request["session"]): boolean {
  return !!(session?.adminId && session?.impersonatedFacilityId);
}

/**
 * Helper: Get the effective facility ID for the current session
 * Returns impersonated facility for admins, or the owner's facility
 */
export function getEffectiveFacilityId(session: Request["session"], requestedFacilityId?: string): string | null {
  if (session?.adminId && session?.impersonatedFacilityId) {
    return session.impersonatedFacilityId;
  }
  return requestedFacilityId || null;
}

/**
 * Helper: Check if current session can access a specific facility
 * Returns boolean instead of throwing, for use in route handlers
 */
export async function canAccessFacility(
  session: Request["session"],
  requestedFacilityId: string
): Promise<boolean> {
  try {
    await resolveActiveFacilityId(session, requestedFacilityId);
    return true;
  } catch {
    return false;
  }
}
