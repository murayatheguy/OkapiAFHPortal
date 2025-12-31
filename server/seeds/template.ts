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
  lastUpdated: "2024-12-30",

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

  // ============ SAMPLE IMAGES ============
  // 10 high-quality house/home images for facility galleries
  sampleImages: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop", // Modern house exterior
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop", // Beautiful home front
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop", // Luxury home
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop", // Cozy living room
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop", // Modern interior
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop", // Home with garden
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop", // Classic house
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop", // Pool house
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop", // Home entrance
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop", // Modern home night
  ],

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
