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
 * Also recognizes owner sessions and auto-links to staff records
 */
export async function requireStaffAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let staffId = req.session.staffId;
    let staffFacilityId = req.session.staffFacilityId;

    // If no staff session but owner is logged in, try to find linked staff record
    if (!staffId && req.session.ownerId) {
      const ownerId = req.session.ownerId;
      // Get owner's facilities and try to find a linked staff record
      const facilities = await storage.getFacilitiesByOwner(ownerId);

      for (const facility of facilities) {
        const linkedStaff = await storage.getStaffAuthByLinkedOwner(ownerId, facility.id);
        if (linkedStaff && linkedStaff.status === "active") {
          // Found a linked staff record, set session
          req.session.staffId = linkedStaff.id;
          req.session.staffFacilityId = linkedStaff.facilityId;
          req.session.staffRole = linkedStaff.role;
          staffId = linkedStaff.id;
          staffFacilityId = linkedStaff.facilityId;
          break;
        }
      }
    }

    if (!staffId || !staffFacilityId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Handle temporary staff sessions (facility PIN login)
    if (req.session.isTempStaff) {
      const staffName = req.session.staffName || "Staff";
      const nameParts = staffName.split(" ");

      // Create a virtual staff object for temp sessions
      req.staff = {
        id: staffId,
        facilityId: staffFacilityId,
        teamMemberId: null,
        linkedOwnerId: null,
        email: "",
        passwordHash: null,
        pin: null,
        firstName: nameParts[0] || staffName,
        lastName: nameParts.slice(1).join(" ") || "",
        role: req.session.staffRole || "caregiver",
        permissions: {
          canAdministerMeds: true,
          canAdministerControlled: false,
          canFileIncidents: true,
          canEditResidents: false,
        },
        status: "active",
        inviteToken: null,
        inviteExpiresAt: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      req.staffPermissions = req.staff.permissions;
      return next();
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

    // Admins and owners have all permissions
    if (req.staff.role === "admin" || req.staff.role === "owner") {
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
