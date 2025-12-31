import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { auditLogs } from "@shared/schema";
import { logger } from "../utils/logger";

export interface AuditContext {
  action: "view" | "create" | "update" | "delete" | "login" | "logout" | "export";
  resourceType: string;
  resourceId?: string;
  description?: string;
  previousValues?: any;
  newValues?: any;
}

/**
 * Log PHI access for HIPAA compliance
 */
export async function logPHIAccess(req: Request, context: AuditContext): Promise<void> {
  try {
    const user = (req as any).user;

    await db.insert(auditLogs).values({
      userId: user?.id || null,
      userRole: user?.role || "anonymous",
      userEmail: user?.email || null,

      action: context.action,
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      facilityId: (req as any).facilityScope || null,
      description: context.description,
      previousValues: context.previousValues,
      newValues: context.newValues,

      ipAddress: req.ip || req.socket?.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      sessionId: req.sessionID || null,

      isSecurityEvent: false,
    });
  } catch (error) {
    logger.error({ error }, "Failed to write audit log");
  }
}

/**
 * Log security events (failed logins, permission denials, etc.)
 */
export async function logSecurityEvent(event: {
  type: string;
  userId?: string;
  facilityId?: string;
  ip?: string;
  details?: any;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: event.userId,
      facilityId: event.facilityId,
      action: "security_event",
      resourceType: "security",
      description: event.type,
      newValues: event.details,
      ipAddress: event.ip,
      isSecurityEvent: true,
      securityEventType: event.type,
    });
  } catch (error) {
    logger.error({ error }, "Failed to write security event");
  }
}

/**
 * Middleware for automatic PHI access logging
 */
export function auditMiddleware(resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function(body: any) {
      // Only log successful requests
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const action = methodToAction(req.method);
        logPHIAccess(req, {
          action,
          resourceType,
          resourceId: req.params.id,
        }).catch(err => logger.error({ err }, "Audit log failed"));
      }
      return originalJson(body);
    };

    next();
  };
}

function methodToAction(method: string): AuditContext["action"] {
  switch (method) {
    case "GET": return "view";
    case "POST": return "create";
    case "PUT":
    case "PATCH": return "update";
    case "DELETE": return "delete";
    default: return "view";
  }
}
