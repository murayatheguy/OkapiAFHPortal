/**
 * Feature Flags for Okapi Care Network
 *
 * Controls which features are enabled/disabled across the application.
 * PHI-related features are disabled until HIPAA compliance is complete.
 *
 * PHASE 1 (Current): Marketplace only - no PHI storage
 * PHASE 2 (Q2 2025): Full EHR capabilities with HIPAA compliance
 */

export const FEATURES = {
  // ============ PHASE 1: ENABLED ============
  // These features are available now

  // Facility directory and search
  FACILITY_DIRECTORY: true,

  // Owner can manage facility listing
  FACILITY_MANAGEMENT: true,

  // Family inquiries
  INQUIRIES: true,

  // Reviews and ratings
  REVIEWS: true,

  // Staff list (names, roles - no credentials)
  STAFF_LIST: true,

  // Transport marketplace
  TRANSPORT: true,

  // DSHS form templates (blank forms, no PHI)
  DSHS_FORMS: true,

  // Activity log (non-PHI events)
  ACTIVITY_LOG: true,

  // ============ PHASE 2: COMING SOON ============
  // These features require HIPAA compliance (Q2 2025)

  // Resident profiles and care data
  RESIDENTS: false,

  // Medications and eMAR
  MEDICATIONS: false,

  // ADL documentation
  ADL_DOCUMENTATION: false,

  // Incident reports
  INCIDENTS: false,

  // Care plans (NCP with resident data)
  CARE_PLANS: false,

  // Staff credentials and certifications
  STAFF_CREDENTIALS: false,

  // Vitals tracking
  VITALS: false,

  // Daily notes
  DAILY_NOTES: false,

  // Full EHR dashboard
  EHR_DASHBOARD: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature] === true;
}

/**
 * Get all disabled features (coming soon)
 */
export function getComingSoonFeatures(): FeatureFlag[] {
  return (Object.keys(FEATURES) as FeatureFlag[]).filter(
    (key) => !FEATURES[key]
  );
}

/**
 * Target release date for Phase 2
 */
export const PHASE_2_TARGET = "Q2 2025";
