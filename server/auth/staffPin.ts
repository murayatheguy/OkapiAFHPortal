import crypto from "crypto";
import { db } from "../db";
import { staffAuth, trustedDevices } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { logSecurityEvent } from "../middleware/audit";
import { logger } from "../utils/logger";

const PIN_CONFIG = {
  minLength: 6,
  maxAttempts: 5,
  lockoutMinutes: 15,
  requireDeviceTrust: true,
};

interface PINAuthResult {
  success: boolean;
  staff?: any;
  error?: string;
  remainingAttempts?: number;
}

/**
 * Authenticate staff via PIN
 */
export async function authenticateStaffPIN(
  facilityId: string,
  pin: string,
  deviceId: string,
  ipAddress: string
): Promise<PINAuthResult> {

  // Validate PIN format
  if (!pin || pin.length < PIN_CONFIG.minLength) {
    return { success: false, error: "Invalid PIN format" };
  }

  // Check device trust if required
  if (PIN_CONFIG.requireDeviceTrust) {
    const [device] = await db
      .select()
      .from(trustedDevices)
      .where(and(
        eq(trustedDevices.facilityId, facilityId),
        eq(trustedDevices.deviceId, deviceId),
        eq(trustedDevices.isActive, true)
      ));

    if (!device) {
      await logSecurityEvent({
        type: "untrusted_device_pin_attempt",
        facilityId,
        ip: ipAddress,
        details: { deviceId },
      });
      return { success: false, error: "Device not authorized. Contact administrator." };
    }
  }

  // Find staff by hashed PIN
  const hashedPin = hashPIN(pin);
  const [staff] = await db
    .select()
    .from(staffAuth)
    .where(and(
      eq(staffAuth.facilityId, facilityId),
      eq(staffAuth.pinHash, hashedPin),
      eq(staffAuth.isActive, true)
    ));

  if (!staff) {
    await logSecurityEvent({
      type: "pin_auth_failed",
      facilityId,
      ip: ipAddress,
    });
    return { success: false, error: "Invalid PIN" };
  }

  // Check lockout
  if (staff.lockedUntil && new Date(staff.lockedUntil) > new Date()) {
    const minutesRemaining = Math.ceil(
      (new Date(staff.lockedUntil).getTime() - Date.now()) / 60000
    );
    return {
      success: false,
      error: `Account locked. Try again in ${minutesRemaining} minutes.`
    };
  }

  // Success - reset failures and update last login
  await db.update(staffAuth)
    .set({
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    })
    .where(eq(staffAuth.id, staff.id));

  // Update device last used
  if (deviceId) {
    await db.update(trustedDevices)
      .set({ lastUsedAt: new Date() })
      .where(and(
        eq(trustedDevices.facilityId, facilityId),
        eq(trustedDevices.deviceId, deviceId)
      ));
  }

  await logSecurityEvent({
    type: "pin_auth_success",
    facilityId,
    ip: ipAddress,
    details: { staffId: staff.id, staffName: `${staff.firstName} ${staff.lastName}` },
  });

  logger.info({ staffId: staff.id, facilityId }, "Staff PIN login successful");

  return { success: true, staff };
}

/**
 * Handle failed PIN attempt
 */
export async function handleFailedPINAttempt(
  facilityId: string,
  ipAddress: string
): Promise<{ remainingAttempts: number; lockedUntil?: Date }> {
  // This would be called if we could identify the user
  // For now, just log the failure
  await logSecurityEvent({
    type: "pin_auth_failed",
    facilityId,
    ip: ipAddress,
  });

  return { remainingAttempts: PIN_CONFIG.maxAttempts };
}

/**
 * Hash PIN for storage
 */
export function hashPIN(pin: string): string {
  return crypto.createHash("sha256").update(pin).digest("hex");
}

/**
 * Generate a random PIN
 */
export function generatePIN(length: number = 6): string {
  const digits = "0123456789";
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += digits[crypto.randomInt(0, 10)];
  }
  return pin;
}

/**
 * Register a trusted device
 */
export async function registerTrustedDevice(
  facilityId: string,
  deviceId: string,
  deviceName: string,
  deviceType: string,
  authorizedBy: string
): Promise<void> {
  await db.insert(trustedDevices).values({
    facilityId,
    deviceId,
    deviceName,
    deviceType,
    authorizedBy,
    isActive: true,
  }).onConflictDoUpdate({
    target: [trustedDevices.facilityId, trustedDevices.deviceId],
    set: {
      deviceName,
      deviceType,
      authorizedBy,
      isActive: true,
      authorizedAt: new Date(),
    },
  });

  logger.info({ facilityId, deviceId, deviceName }, "Trusted device registered");
}

/**
 * Revoke a trusted device
 */
export async function revokeTrustedDevice(
  facilityId: string,
  deviceId: string
): Promise<void> {
  await db.update(trustedDevices)
    .set({ isActive: false })
    .where(and(
      eq(trustedDevices.facilityId, facilityId),
      eq(trustedDevices.deviceId, deviceId)
    ));

  logger.info({ facilityId, deviceId }, "Trusted device revoked");
}
