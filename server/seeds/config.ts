/**
 * Seed Configuration & Safety Settings
 *
 * This file controls seed behavior and provides production safety.
 */

export const SEED_CONFIG = {
  // Version tracking
  version: "1.0.0",

  // Test data identifier - used to mark and find test data
  testDataMarker: {
    // License numbers for test facilities start with this
    licensePrefix: "TEST-AFH-",
    // Email domain for test owners
    emailDomain: "example.com",
    // Description contains this string
    descriptionMarker: "[TEST DATA]",
  },

  // Default password for all test accounts (will be hashed)
  testPassword: "test123",

  // Safety settings
  safety: {
    // Block seed in production unless explicitly overridden
    blockProductionSeed: true,
    // Environment variable to override production block
    productionOverrideVar: "ALLOW_PROD_SEED",
    // Require confirmation before deleting test data
    requireDeleteConfirmation: true,
  },

  // Logging
  logging: {
    verbose: process.env.SEED_VERBOSE === "true",
    logFile: "seed.log",
  },
};

/**
 * Check if we're in a safe environment to run seed
 */
export function checkEnvironmentSafety(): { safe: boolean; reason?: string } {
  const env = process.env.NODE_ENV;
  const isProduction = env === "production";
  const hasOverride = process.env[SEED_CONFIG.safety.productionOverrideVar] === "true";

  if (isProduction && SEED_CONFIG.safety.blockProductionSeed && !hasOverride) {
    return {
      safe: false,
      reason: `
❌ SEED BLOCKED: Production environment detected

To run seed in production (DANGEROUS), set:
  ${SEED_CONFIG.safety.productionOverrideVar}=true

This is NOT recommended for production databases with real customer data.
      `.trim(),
    };
  }

  if (isProduction && hasOverride) {
    console.warn(`
⚠️  WARNING: Running seed in PRODUCTION with override enabled.
    This may affect real customer data. Proceed with caution.
    `);
  }

  return { safe: true };
}

/**
 * Check if a record is test data based on markers
 */
export function isTestData(record: {
  licenseNumber?: string | null;
  email?: string | null;
  description?: string | null;
}): boolean {
  const { testDataMarker } = SEED_CONFIG;

  if (record.licenseNumber?.startsWith(testDataMarker.licensePrefix)) {
    return true;
  }

  if (record.email?.endsWith(`@${testDataMarker.emailDomain}`)) {
    return true;
  }

  if (record.description?.includes(testDataMarker.descriptionMarker)) {
    return true;
  }

  return false;
}

/**
 * Generate a test license number
 */
export function generateTestLicenseNumber(index: number): string {
  return `${SEED_CONFIG.testDataMarker.licensePrefix}${String(index + 1).padStart(3, "0")}`;
}
