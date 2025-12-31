import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

// Get key from environment or generate warning
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    console.warn("WARNING: ENCRYPTION_KEY not set. Using random key (data will be lost on restart)");
    return crypto.randomBytes(32);
  }
  return Buffer.from(keyHex, "hex");
}

const KEY = getEncryptionKey();

interface EncryptedData {
  iv: string;
  data: string;
  tag: string;
}

/**
 * Encrypt sensitive field (SSN, medical info, etc.)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const payload: EncryptedData = {
    iv: iv.toString("base64"),
    data: encrypted,
    tag: cipher.getAuthTag().toString("base64"),
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Decrypt sensitive field
 */
export function decrypt(encryptedBase64: string): string {
  try {
    const payload: EncryptedData = JSON.parse(
      Buffer.from(encryptedBase64, "base64").toString("utf8")
    );

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      KEY,
      Buffer.from(payload.iv, "base64")
    );

    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

    let decrypted = decipher.update(payload.data, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed");
  }
}

/**
 * Encrypt JSON object
 */
export function encryptJSON(obj: any): string {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt JSON object
 */
export function decryptJSON<T = any>(encrypted: string): T {
  return JSON.parse(decrypt(encrypted));
}
