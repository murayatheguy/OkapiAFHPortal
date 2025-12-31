import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import { db } from "../db";
import { userMfa } from "@shared/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "../utils/encryption";
import { logger } from "../utils/logger";

interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Generate MFA setup for user
 */
export async function setupMFA(userId: string, email: string): Promise<MFASetup> {
  const secret = speakeasy.generateSecret({
    name: `Okapi Care (${email})`,
    issuer: "Okapi Care Network",
    length: 20,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
  const backupCodes = generateBackupCodes(8);

  // Store encrypted secret and hashed backup codes
  await db.insert(userMfa).values({
    userId,
    encryptedSecret: encrypt(secret.base32),
    backupCodes: backupCodes.map(code => hashBackupCode(code)),
    isEnabled: false,
  }).onConflictDoUpdate({
    target: userMfa.userId,
    set: {
      encryptedSecret: encrypt(secret.base32),
      backupCodes: backupCodes.map(code => hashBackupCode(code)),
      isEnabled: false,
      updatedAt: new Date(),
    },
  });

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Enable MFA after user verifies token
 */
export async function enableMFA(userId: string, token: string): Promise<boolean> {
  const config = await getMFAConfig(userId);
  if (!config) return false;

  const secret = decrypt(config.encryptedSecret);
  const valid = verifyToken(secret, token);

  if (valid) {
    await db.update(userMfa)
      .set({ isEnabled: true, updatedAt: new Date() })
      .where(eq(userMfa.userId, userId));
  }

  return valid;
}

/**
 * Disable MFA for user
 */
export async function disableMFA(userId: string): Promise<void> {
  await db.delete(userMfa).where(eq(userMfa.userId, userId));
}

/**
 * Verify MFA token
 */
export function verifyToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1, // Allow 1 step tolerance
  });
}

/**
 * Verify MFA for user login
 */
export async function verifyMFA(userId: string, token: string): Promise<boolean> {
  const config = await getMFAConfig(userId);
  if (!config || !config.isEnabled) return true; // MFA not enabled

  const secret = decrypt(config.encryptedSecret);
  const valid = verifyToken(secret, token);

  if (valid) {
    await db.update(userMfa)
      .set({ lastUsedAt: new Date(), failedAttempts: 0 })
      .where(eq(userMfa.userId, userId));
  } else {
    await db.update(userMfa)
      .set({ failedAttempts: (config.failedAttempts || 0) + 1 })
      .where(eq(userMfa.userId, userId));
  }

  return valid;
}

/**
 * Verify and consume backup code
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const config = await getMFAConfig(userId);
  if (!config) return false;

  const hashedInput = hashBackupCode(code);
  const codes = config.backupCodes as string[];
  const index = codes.findIndex(bc => bc === hashedInput);

  if (index === -1) return false;

  // Remove used code
  const newCodes = [...codes];
  newCodes.splice(index, 1);

  await db.update(userMfa)
    .set({ backupCodes: newCodes, lastUsedAt: new Date() })
    .where(eq(userMfa.userId, userId));

  logger.info({ userId }, "Backup code used");
  return true;
}

/**
 * Check if user has MFA enabled
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  const config = await getMFAConfig(userId);
  return config?.isEnabled || false;
}

/**
 * Get MFA configuration for user
 */
export async function getMFAConfig(userId: string) {
  const [config] = await db
    .select()
    .from(userMfa)
    .where(eq(userMfa.userId, userId));
  return config;
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );
}

/**
 * Hash backup code for storage
 */
function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}
