/**
 * AFH Template - Source of Truth
 *
 * This file defines the STRUCTURE and PATTERNS for all Adult Family Homes.
 * Changes here affect NEW facilities created by the seed.
 *
 * @version 1.0.0
 */

export const AFH_TEMPLATE = {
  // ============ META ============
  version: "1.0.0",
  lastUpdated: "2024-12-25",

  // ============ FACILITY DEFAULTS ============
  facility: {
    type: "afh" as const,
    state: "WA",
    bedCount: {
      min: 4,
      max: 6,
      default: 6,
    },
    status: "active",
    claimStatus: "claimed",
  },

  // ============ RESIDENT CONFIGURATION ============
  residents: {
    count: { min: 2, max: 5 },
    age: { min: 65, max: 95 },
    statuses: ["active", "hospitalized", "on-leave"],
    codeStatuses: ["full_code", "dnr", "dnr_dni", "comfort_care"],
    genders: ["male", "female"],
    allergies: ["Penicillin", "Sulfa drugs", "Aspirin", "NSAIDs", "Shellfish", "Peanuts", null],
    diagnoses: [
      ["Alzheimer's Disease", "Hypertension"],
      ["Vascular Dementia", "Type 2 Diabetes"],
      ["Parkinson's Disease", "Depression"],
      ["Dementia", "Anxiety", "GERD"],
      ["Schizophrenia", "Type 2 Diabetes"],
      ["Bipolar Disorder", "Hypertension"],
      ["COPD", "Congestive Heart Failure"],
      ["Stroke (CVA)", "Dysphagia", "Depression"],
      ["Type 2 Diabetes", "Peripheral Neuropathy"],
      ["Chronic Kidney Disease", "Anemia"],
    ],
    relationships: ["Daughter", "Son", "Spouse", "Sibling", "Niece", "Nephew", "Friend", "Guardian"],
  },

  // ============ STAFF CONFIGURATION ============
  staff: {
    count: { min: 2, max: 4 },
    roles: ["Lead Caregiver", "Caregiver", "CNA", "HCA", "Medication Aide"],
    statuses: ["Active", "on-leave"],
    employmentYears: { min: 0, max: 5 },
  },

  // ============ SPECIALTY OVERRIDES ============
  specialtyOverrides: {
    dementia: {
      pricing: { baseRateMin: 5500, baseRateMax: 8500 },
    },
    mentalHealth: {
      pricing: { baseRateMin: 4500, baseRateMax: 7000 },
    },
    developmentalDisabilities: {
      residents: { ageMin: 21, ageMax: 75 },
      pricing: { baseRateMin: 5000, baseRateMax: 7500 },
    },
    hospice: {
      pricing: { baseRateMin: 6000, baseRateMax: 9500 },
    },
    veterans: {
      pricing: { baseRateMin: 5000, baseRateMax: 8000 },
    },
    budget: {
      pricing: { baseRateMin: 3500, baseRateMax: 5500 },
    },
    premium: {
      pricing: { baseRateMin: 8000, baseRateMax: 12000 },
    },
    vietnamese: {
      culturalServices: { languagesSpoken: ["English", "Vietnamese"] },
    },
    spanish: {
      culturalServices: { languagesSpoken: ["English", "Spanish"] },
    },
  },
};

export type AFHTemplate = typeof AFH_TEMPLATE;
export type Specialty = keyof typeof AFH_TEMPLATE.specialtyOverrides;

/**
 * Get specialty overrides for pricing
 */
export function getSpecialtyPricing(specialty?: Specialty): { min: number; max: number } {
  if (!specialty || !AFH_TEMPLATE.specialtyOverrides[specialty]) {
    return { min: 4500, max: 7500 };
  }

  const overrides = AFH_TEMPLATE.specialtyOverrides[specialty];
  if ("pricing" in overrides) {
    return {
      min: overrides.pricing.baseRateMin,
      max: overrides.pricing.baseRateMax,
    };
  }
  return { min: 4500, max: 7500 };
}

/**
 * Get resident age range for specialty
 */
export function getResidentAgeRange(specialty?: Specialty): { min: number; max: number } {
  if (specialty === "developmentalDisabilities") {
    return { min: 21, max: 75 };
  }
  return { min: AFH_TEMPLATE.residents.age.min, max: AFH_TEMPLATE.residents.age.max };
}
