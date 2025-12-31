import { Request, Response, NextFunction } from "express";
import { hasPermission, Permission } from "@shared/permissions";
import { logSecurityEvent } from "./audit";

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH_REQUIRED", message: "Authentication required" }
      });
    }

    if (!hasPermission(user.role, permission)) {
      logSecurityEvent({
        type: "permission_denied",
        userId: user.id,
        ip: req.ip,
        details: { required: permission, role: user.role },
      });

      return res.status(403).json({
        success: false,
        error: { code: "PERMISSION_DENIED", message: "Permission denied" }
      });
    }

    next();
  };
}
