import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { StaffAuth, StaffPermissions } from "@shared/schema";

// Extend Express Request to include staff data
declare global {
  namespace Express {
    interface Request {
      staff?: StaffAuth;
      staffPermissions?: StaffPermissions;
    }
  }
}

/**
 * Middleware to require staff authentication
 * Verifies session has valid staffId and loads staff data
 */
export async function requireStaffAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const staffId = req.session.staffId;
    const staffFacilityId = req.session.staffFacilityId;

    if (!staffId || !staffFacilityId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const staff = await storage.getStaffAuth(staffId);
    if (!staff) {
      // Clear invalid session
      req.session.staffId = null;
      req.session.staffFacilityId = null;
      req.session.staffRole = null;
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (staff.status !== "active") {
      return res.status(403).json({ error: "Account is not active" });
    }

    // Attach staff to request for use in route handlers
    req.staff = staff;
    req.staffPermissions = staff.permissions || undefined;

    next();
  } catch (error) {
    console.error("Staff auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
}

/**
 * Middleware to require specific staff role
 * Must be used after requireStaffAuth
 */
export function requireStaffRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.staff) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!roles.includes(req.staff.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

/**
 * Middleware to require specific permission
 * Must be used after requireStaffAuth
 */
export function requirePermission(permission: keyof StaffPermissions) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.staff) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Admins have all permissions
    if (req.staff.role === "admin") {
      return next();
    }

    const permissions = req.staffPermissions;
    if (!permissions || !permissions[permission]) {
      return res.status(403).json({ error: "Permission denied" });
    }

    next();
  };
}

/**
 * Middleware to verify staff belongs to the specified facility
 * Must be used after requireStaffAuth
 */
export function requireFacilityAccess(facilityIdParam: string = "facilityId") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.staff) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const facilityId = req.params[facilityIdParam] || req.body?.facilityId;

    if (!facilityId) {
      return res.status(400).json({ error: "Facility ID required" });
    }

    if (req.staff.facilityId !== facilityId) {
      return res.status(403).json({ error: "Access denied to this facility" });
    }

    next();
  };
}
