import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import {
  failedLoginAttempts,
  activeSessions,
  securitySettings,
  passwordHistory
} from "@shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Default security settings (HIPAA-compliant defaults)
export const DEFAULT_SECURITY_SETTINGS = {
  sessionTimeoutMinutes: 15,
  maxFailedLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  maxConcurrentSessions: 3,
  minPasswordLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  passwordExpiryDays: 90,
  passwordHistoryCount: 12,
};

// Get security settings for a facility (or defaults)
export async function getSecuritySettings(facilityId?: string | null) {
  if (!facilityId) return DEFAULT_SECURITY_SETTINGS;

  const [settings] = await db
    .select()
    .from(securitySettings)
    .where(eq(securitySettings.facilityId, facilityId))
    .limit(1);

  if (!settings) return DEFAULT_SECURITY_SETTINGS;

  return {
    sessionTimeoutMinutes: settings.sessionTimeoutMinutes ?? DEFAULT_SECURITY_SETTINGS.sessionTimeoutMinutes,
    maxFailedLoginAttempts: settings.maxFailedLoginAttempts ?? DEFAULT_SECURITY_SETTINGS.maxFailedLoginAttempts,
    lockoutDurationMinutes: settings.lockoutDurationMinutes ?? DEFAULT_SECURITY_SETTINGS.lockoutDurationMinutes,
    maxConcurrentSessions: settings.maxConcurrentSessions ?? DEFAULT_SECURITY_SETTINGS.maxConcurrentSessions,
    minPasswordLength: settings.minPasswordLength ?? DEFAULT_SECURITY_SETTINGS.minPasswordLength,
    requireUppercase: settings.requireUppercase ?? DEFAULT_SECURITY_SETTINGS.requireUppercase,
    requireLowercase: settings.requireLowercase ?? DEFAULT_SECURITY_SETTINGS.requireLowercase,
    requireNumbers: settings.requireNumbers ?? DEFAULT_SECURITY_SETTINGS.requireNumbers,
    requireSpecialChars: settings.requireSpecialChars ?? DEFAULT_SECURITY_SETTINGS.requireSpecialChars,
    passwordExpiryDays: settings.passwordExpiryDays ?? DEFAULT_SECURITY_SETTINGS.passwordExpiryDays,
    passwordHistoryCount: settings.passwordHistoryCount ?? DEFAULT_SECURITY_SETTINGS.passwordHistoryCount,
  };
}

// Check if account is locked
export async function isAccountLocked(
  identifier: string,
  userType: "owner" | "staff",
  facilityId?: string | null
): Promise<{ locked: boolean; lockedUntil?: Date; remainingMinutes?: number }> {
  const settings = await getSecuritySettings(facilityId);
  const lockoutWindow = new Date(Date.now() - settings.lockoutDurationMinutes * 60 * 1000);

  // Count recent failed attempts
  const whereConditions = [
    eq(failedLoginAttempts.userType, userType),
    gte(failedLoginAttempts.attemptedAt, lockoutWindow),
  ];

  if (userType === "owner") {
    whereConditions.push(eq(failedLoginAttempts.email, identifier));
  } else {
    whereConditions.push(eq(failedLoginAttempts.staffName, identifier));
  }

  const recentAttempts = await db
    .select()
    .from(failedLoginAttempts)
    .where(and(...whereConditions))
    .orderBy(desc(failedLoginAttempts.attemptedAt));

  if (recentAttempts.length >= settings.maxFailedLoginAttempts) {
    const oldestAttempt = recentAttempts[recentAttempts.length - 1];
    if (oldestAttempt.attemptedAt) {
      const lockedUntil = new Date(
        oldestAttempt.attemptedAt.getTime() + settings.lockoutDurationMinutes * 60 * 1000
      );

      if (lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        return { locked: true, lockedUntil, remainingMinutes };
      }
    }
  }

  return { locked: false };
}

// Record failed login attempt
export async function recordFailedLogin(
  identifier: string,
  userType: "owner" | "staff",
  facilityId: string | undefined,
  req: Request
): Promise<void> {
  await db.insert(failedLoginAttempts).values({
    email: userType === "owner" ? identifier : null,
    staffName: userType === "staff" ? identifier : null,
    facilityId: facilityId || null,
    userType,
    ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || null,
    userAgent: req.headers["user-agent"] || null,
  });
}

// Clear failed attempts on successful login
export async function clearFailedAttempts(
  identifier: string,
  userType: "owner" | "staff"
): Promise<void> {
  if (userType === "owner") {
    await db
      .delete(failedLoginAttempts)
      .where(
        and(
          eq(failedLoginAttempts.email, identifier),
          eq(failedLoginAttempts.userType, userType)
        )
      );
  } else {
    await db
      .delete(failedLoginAttempts)
      .where(
        and(
          eq(failedLoginAttempts.staffName, identifier),
          eq(failedLoginAttempts.userType, userType)
        )
      );
  }
}

// Create or update active session
export async function createActiveSession(
  sessionId: string,
  userId: string,
  userType: "owner" | "staff",
  facilityId: string | null,
  req: Request,
  timeoutMinutes: number = 15
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000);

  await db.insert(activeSessions).values({
    id: sessionId,
    userId,
    userType,
    facilityId,
    createdAt: now,
    lastActivityAt: now,
    expiresAt,
    ipAddress: req.ip || (req.headers["x-forwarded-for"] as string) || null,
    userAgent: req.headers["user-agent"] || null,
    isValid: true,
  }).onConflictDoUpdate({
    target: activeSessions.id,
    set: {
      lastActivityAt: now,
      expiresAt,
      isValid: true,
    },
  });
}

// Invalidate session
export async function invalidateSession(sessionId: string): Promise<void> {
  await db
    .update(activeSessions)
    .set({ isValid: false })
    .where(eq(activeSessions.id, sessionId));
}

// Update session activity
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const now = new Date();
  await db
    .update(activeSessions)
    .set({ lastActivityAt: now })
    .where(eq(activeSessions.id, sessionId));
}

// Password validation
export function validatePassword(
  password: string,
  settings?: typeof DEFAULT_SECURITY_SETTINGS
): { valid: boolean; errors: string[] } {
  const config = settings || DEFAULT_SECURITY_SETTINGS;
  const errors: string[] = [];

  if (password.length < config.minPasswordLength) {
    errors.push(`Password must be at least ${config.minPasswordLength} characters`);
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (config.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return { valid: errors.length === 0, errors };
}

// Check password history
export async function isPasswordInHistory(
  ownerId: string,
  newPassword: string,
  historyCount: number = 12
): Promise<boolean> {
  const history = await db
    .select()
    .from(passwordHistory)
    .where(eq(passwordHistory.ownerId, ownerId))
    .orderBy(desc(passwordHistory.createdAt))
    .limit(historyCount);

  for (const h of history) {
    const matches = await bcrypt.compare(newPassword, h.passwordHash);
    if (matches) return true;
  }

  return false;
}

// Add password to history
export async function addPasswordToHistory(
  ownerId: string,
  passwordHash: string
): Promise<void> {
  await db.insert(passwordHistory).values({
    ownerId,
    passwordHash,
  });
}

// Session timeout middleware
export function sessionTimeoutMiddleware(defaultTimeout: number = 15) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip for non-authenticated routes
    if (!req.session?.ownerId && !req.session?.staffId) {
      return next();
    }

    const sessionId = req.sessionID;
    if (!sessionId) return next();

    try {
      // Get the session from database
      const [session] = await db
        .select()
        .from(activeSessions)
        .where(eq(activeSessions.id, sessionId))
        .limit(1);

      if (session && session.isValid) {
        const settings = await getSecuritySettings(session.facilityId);
        const timeoutMs = (settings.sessionTimeoutMinutes || defaultTimeout) * 60 * 1000;
        const now = new Date();

        // Check if session has timed out
        if (session.lastActivityAt) {
          const timeSinceActivity = now.getTime() - session.lastActivityAt.getTime();
          if (timeSinceActivity > timeoutMs) {
            // Invalidate session
            await invalidateSession(sessionId);

            // Clear session data
            req.session.ownerId = undefined;
            req.session.staffId = undefined;
            req.session.staffFacilityId = undefined;
            req.session.staffRole = undefined;

            return res.status(401).json({
              error: "Session expired",
              code: "SESSION_TIMEOUT",
              message: "Your session has expired due to inactivity. Please log in again.",
            });
          }
        }

        // Update last activity
        await updateSessionActivity(sessionId);
      }

      next();
    } catch (error) {
      console.error("Session timeout middleware error:", error);
      next();
    }
  };
}

// Get remaining attempts before lockout
export async function getRemainingAttempts(
  identifier: string,
  userType: "owner" | "staff",
  facilityId?: string | null
): Promise<number> {
  const settings = await getSecuritySettings(facilityId);
  const lockoutWindow = new Date(Date.now() - settings.lockoutDurationMinutes * 60 * 1000);

  const whereConditions = [
    eq(failedLoginAttempts.userType, userType),
    gte(failedLoginAttempts.attemptedAt, lockoutWindow),
  ];

  if (userType === "owner") {
    whereConditions.push(eq(failedLoginAttempts.email, identifier));
  } else {
    whereConditions.push(eq(failedLoginAttempts.staffName, identifier));
  }

  const recentAttempts = await db
    .select()
    .from(failedLoginAttempts)
    .where(and(...whereConditions));

  return Math.max(0, settings.maxFailedLoginAttempts - recentAttempts.length);
}
