import { Request, Response, NextFunction } from "express";
import { logSecurityEvent } from "./audit";

declare global {
  namespace Express {
    interface Request {
      facilityScope?: string | null;
    }
  }
}

/**
 * Enforces facility-level data isolation
 * Prevents cross-facility PHI access
 */
export function enforceFacilityScope(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Admin can access all facilities
  if (user.role === "admin") {
    req.facilityScope = null; // null = all access
    return next();
  }

  // Owner/Staff must have facilityId
  if (!user.facilityId) {
    return res.status(403).json({ error: "No facility access configured" });
  }

  req.facilityScope = user.facilityId;

  // Check if trying to access different facility
  const requestedFacilityId =
    req.params.facilityId ||
    req.body?.facilityId ||
    req.query?.facilityId;

  if (requestedFacilityId && requestedFacilityId !== user.facilityId) {
    // Log security event
    logSecurityEvent({
      type: "cross_facility_access_attempt",
      userId: user.id,
      facilityId: user.facilityId,
      ip: req.ip,
      details: { attemptedFacility: requestedFacilityId },
    });

    return res.status(403).json({ error: "Access denied" });
  }

  next();
}
