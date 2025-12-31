import { Request, Response, NextFunction } from "express";
import { logSecurityEvent } from "./audit";

/**
 * Require admin role for access
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: "AUTH_REQUIRED", message: "Authentication required" }
    });
  }

  if (user.role !== "admin") {
    logSecurityEvent({
      type: "admin_access_denied",
      userId: user.id,
      ip: req.ip,
      details: { attemptedPath: req.path },
    });

    return res.status(403).json({
      success: false,
      error: { code: "ADMIN_REQUIRED", message: "Admin access required" }
    });
  }

  next();
}
