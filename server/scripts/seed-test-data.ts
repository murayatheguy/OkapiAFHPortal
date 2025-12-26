import { db } from "../db";
import {
  owners,
  facilities,
  facilityCapabilities,
  residents,
  teamMembers,
  staffAuth
} from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const PASSWORD = "test123";

// Helper to hash password
async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// Random helper
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Slugify helper
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Data pools
const firstNames = ["Maria", "James", "Linda", "Robert", "Patricia", "Michael", "Barbara", "William", "Elizabeth", "David", "Jennifer", "Richard", "Susan", "Joseph", "Margaret", "Thomas", "Dorothy", "Charles", "Lisa", "Daniel", "Nancy", "Matthew", "Karen", "Anthony", "Betty", "Donald", "Helen", "Steven", "Sandra", "Paul", "Donna", "Andrew", "Carol", "Joshua", "Ruth", "Kenneth", "Sharon", "Kevin", "Michelle", "Brian"];

const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"];

const cities = ["Seattle", "Tacoma", "Bellevue", "Everett", "Kent", "Renton", "Spokane", "Federal Way", "Yakima", "Bellingham"];
const counties = ["King", "Pierce", "Snohomish", "Spokane", "Clark", "Thurston", "Kitsap", "Yakima", "Whatcom", "Benton"];

const streetNames = ["Oak", "Maple", "Cedar", "Pine", "Elm", "Willow", "Birch", "Cherry", "Walnut", "Spruce"];

const facilityNames = [
  "Sunrise Adult Family Home",
  "Harmony House AFH",
  "Golden Years Care Home",
  "Evergreen Adult Family Home",
  "Comfort Care AFH",
  "Peaceful Pines Home",
  "Loving Hearts AFH",
  "Mountain View Care Home",
  "Serenity Adult Family Home",
  "Caring Hands AFH",
];

const diagnoses = [
  "Alzheimer's Disease",
  "Vascular Dementia",
  "Parkinson's Disease",
  "Type 2 Diabetes",
  "Hypertension",
  "COPD",
  "Congestive Heart Failure",
  "Stroke (CVA)",
  "Depression",
  "Anxiety Disorder",
  "Bipolar Disorder",
  "Schizophrenia",
  "Intellectual Disability",
  "Down Syndrome",
  "Traumatic Brain Injury",
  "Multiple Sclerosis",
  "Rheumatoid Arthritis",
  "Osteoporosis",
];

const allergies = [
  "Penicillin",
  "Sulfa drugs",
  "Aspirin",
  "NSAIDs",
  "Latex",
  "Shellfish",
  "Peanuts",
  "Eggs",
  "Dairy",
  "None known",
  "None known",
  "None known",
];

const codeStatuses = ["full_code", "dnr", "dnr_dni", "comfort_care"];

const staffRoles = ["Caregiver", "Lead Caregiver", "Medication Technician", "CNA", "HCA"];

const specialtiesOptions = [
  ["Dementia", "Alzheimer's"],
  ["Mental Health"],
  ["Developmental Disabilities"],
  ["Dementia", "Parkinson's"],
  ["Hospice", "Palliative Care"],
  ["General Care"],
  ["Dementia", "Memory Care"],
  ["Mental Health", "Behavioral"],
  ["Developmental Disabilities", "Autism"],
  ["Veterans", "PTSD"],
];

// Facility capability profiles (varying specializations)
const capabilityProfiles = [
  {
    // Profile 1: Dementia specialty
    specializations: { dementia: true, alzheimers: true, mentalHealth: false, developmentalDisabilities: false, parkinsons: true, diabetes: true, hospicePalliative: false, traumaticBrainInjury: false, dialysis: false, postSurgeryRehab: false, bariatric: false, youngAdults: false, veterans: false },
    medicalServices: { nursingCare24hr: false, rnOnSite: false, lpnOnSite: false, medicationManagement: true, medicationAdministration: true, injections: false, woundCare: false, catheterCare: false, ostomyCare: false, oxygenTherapy: false, cpapBipap: false, feedingTube: false, physicalTherapy: false, occupationalTherapy: false, speechTherapy: false, bloodGlucoseMonitoring: true, vitalSignsMonitoring: true, hospiceCoordination: false },
    adlCapabilities: { bathing: 'all-levels' as const, dressing: 'all-levels' as const, eating: 'all-levels' as const, mobility: 'wheelchair' as const, toileting: 'all-levels' as const, transferring: 'two-person' as const, continence: 'all-levels' as const },
    paymentAccepted: { privatePay: true, medicaidCOPES: true, medicaidWaiver: false, medicare: false, longTermCareInsurance: true, vaAidAttendance: false, vaCommunityLiving: false, slidingScale: false, financialAssistance: false },
    pricing: { baseRateMin: 5500, baseRateMax: 7500, medicaidRate: 4200, additionalCareRates: { level1: 500, level2: 1000, level3: 1500 }, includesInPricing: ['Room', 'Board', 'Personal Care'], additionalFees: [] },
    amenities: { privateRooms: true, sharedRooms: true, privateBathroom: false, wheelchairAccessible: true, hospitalBeds: false, hoyerLift: false, walkInShower: true, emergencyCallSystem: true, securedMemoryCare: true, wanderPrevention: true, outdoorSpace: true, garden: true, petFriendly: true, petsOnSite: false, smokingAllowed: false, wifi: true, cableTV: true, airConditioning: true, homeCookedMeals: true, specialDiets: true, activities: true, transportation: true, laundry: true, housekeeping: true },
    staffing: { staffToResidentRatio: '1:3', rnHoursPerWeek: 0, lpnHoursPerWeek: 0, cnaCount: 2, overnightStaffAwake: true, bilingualStaff: false, languages: ['English'], specializedTraining: ['Dementia Care', 'CPR', 'First Aid'] },
    culturalServices: { languagesSpoken: ['English'], culturalFoods: [], religiousServices: false, religiousAffiliation: null, lgbtqFriendly: true, culturalActivities: [] },
  },
  {
    // Profile 2: Mental Health specialty
    specializations: { dementia: false, alzheimers: false, mentalHealth: true, developmentalDisabilities: false, parkinsons: false, diabetes: true, hospicePalliative: false, traumaticBrainInjury: false, dialysis: false, postSurgeryRehab: false, bariatric: false, youngAdults: false, veterans: false },
    medicalServices: { nursingCare24hr: false, rnOnSite: false, lpnOnSite: false, medicationManagement: true, medicationAdministration: true, injections: true, woundCare: false, catheterCare: false, ostomyCare: false, oxygenTherapy: false, cpapBipap: false, feedingTube: false, physicalTherapy: false, occupationalTherapy: false, speechTherapy: false, bloodGlucoseMonitoring: true, vitalSignsMonitoring: true, hospiceCoordination: false },
    adlCapabilities: { bathing: 'some-assistance' as const, dressing: 'some-assistance' as const, eating: 'independent-only' as const, mobility: 'all-levels' as const, toileting: 'some-assistance' as const, transferring: 'one-person' as const, continence: 'all-levels' as const },
    paymentAccepted: { privatePay: true, medicaidCOPES: true, medicaidWaiver: true, medicare: false, longTermCareInsurance: false, vaAidAttendance: false, vaCommunityLiving: false, slidingScale: false, financialAssistance: false },
    pricing: { baseRateMin: 4500, baseRateMax: 6500, medicaidRate: 3800, additionalCareRates: { level1: 400, level2: 800, level3: 1200 }, includesInPricing: ['Room', 'Board', 'Personal Care'], additionalFees: [] },
    amenities: { privateRooms: true, sharedRooms: false, privateBathroom: false, wheelchairAccessible: true, hospitalBeds: false, hoyerLift: false, walkInShower: true, emergencyCallSystem: true, securedMemoryCare: false, wanderPrevention: false, outdoorSpace: true, garden: true, petFriendly: false, petsOnSite: false, smokingAllowed: false, wifi: true, cableTV: true, airConditioning: true, homeCookedMeals: true, specialDiets: false, activities: true, transportation: true, laundry: true, housekeeping: true },
    staffing: { staffToResidentRatio: '1:3', rnHoursPerWeek: 0, lpnHoursPerWeek: 0, cnaCount: 2, overnightStaffAwake: false, bilingualStaff: false, languages: ['English'], specializedTraining: ['Mental Health First Aid', 'CPR', 'First Aid'] },
    culturalServices: { languagesSpoken: ['English'], culturalFoods: [], religiousServices: false, religiousAffiliation: null, lgbtqFriendly: true, culturalActivities: [] },
  },
  {
    // Profile 3: Developmental Disabilities specialty
    specializations: { dementia: false, alzheimers: false, mentalHealth: true, developmentalDisabilities: true, parkinsons: false, diabetes: false, hospicePalliative: false, traumaticBrainInjury: false, dialysis: false, postSurgeryRehab: false, bariatric: false, youngAdults: true, veterans: false },
    medicalServices: { nursingCare24hr: false, rnOnSite: false, lpnOnSite: false, medicationManagement: true, medicationAdministration: true, injections: false, woundCare: false, catheterCare: false, ostomyCare: false, oxygenTherapy: false, cpapBipap: false, feedingTube: false, physicalTherapy: false, occupationalTherapy: false, speechTherapy: false, bloodGlucoseMonitoring: false, vitalSignsMonitoring: true, hospiceCoordination: false },
    adlCapabilities: { bathing: 'all-levels' as const, dressing: 'all-levels' as const, eating: 'all-levels' as const, mobility: 'all-levels' as const, toileting: 'all-levels' as const, transferring: 'all-levels' as const, continence: 'all-levels' as const },
    paymentAccepted: { privatePay: true, medicaidCOPES: true, medicaidWaiver: true, medicare: false, longTermCareInsurance: false, vaAidAttendance: false, vaCommunityLiving: false, slidingScale: false, financialAssistance: false },
    pricing: { baseRateMin: 5000, baseRateMax: 7000, medicaidRate: 4000, additionalCareRates: { level1: 500, level2: 1000, level3: 1500 }, includesInPricing: ['Room', 'Board', 'Personal Care'], additionalFees: [] },
    amenities: { privateRooms: true, sharedRooms: true, privateBathroom: false, wheelchairAccessible: true, hospitalBeds: false, hoyerLift: false, walkInShower: true, emergencyCallSystem: true, securedMemoryCare: false, wanderPrevention: false, outdoorSpace: true, garden: false, petFriendly: true, petsOnSite: false, smokingAllowed: false, wifi: true, cableTV: true, airConditioning: true, homeCookedMeals: true, specialDiets: true, activities: true, transportation: true, laundry: true, housekeeping: true },
    staffing: { staffToResidentRatio: '1:2', rnHoursPerWeek: 0, lpnHoursPerWeek: 0, cnaCount: 3, overnightStaffAwake: true, bilingualStaff: false, languages: ['English'], specializedTraining: ['DD Training', 'CPR', 'First Aid'] },
    culturalServices: { languagesSpoken: ['English'], culturalFoods: [], religiousServices: false, religiousAffiliation: null, lgbtqFriendly: true, culturalActivities: [] },
  },
  {
    // Profile 4: General/Mixed care
    specializations: { dementia: true, alzheimers: false, mentalHealth: false, developmentalDisabilities: false, parkinsons: true, diabetes: true, hospicePalliative: false, traumaticBrainInjury: false, dialysis: false, postSurgeryRehab: false, bariatric: false, youngAdults: false, veterans: false },
    medicalServices: { nursingCare24hr: false, rnOnSite: false, lpnOnSite: false, medicationManagement: true, medicationAdministration: true, injections: false, woundCare: false, catheterCare: false, ostomyCare: false, oxygenTherapy: true, cpapBipap: false, feedingTube: false, physicalTherapy: false, occupationalTherapy: false, speechTherapy: false, bloodGlucoseMonitoring: true, vitalSignsMonitoring: true, hospiceCoordination: false },
    adlCapabilities: { bathing: 'all-levels' as const, dressing: 'all-levels' as const, eating: 'all-levels' as const, mobility: 'wheelchair' as const, toileting: 'all-levels' as const, transferring: 'hoyer-lift' as const, continence: 'all-levels' as const },
    paymentAccepted: { privatePay: true, medicaidCOPES: true, medicaidWaiver: false, medicare: false, longTermCareInsurance: true, vaAidAttendance: true, vaCommunityLiving: false, slidingScale: false, financialAssistance: false },
    pricing: { baseRateMin: 5000, baseRateMax: 8000, medicaidRate: 4500, additionalCareRates: { level1: 600, level2: 1200, level3: 1800 }, includesInPricing: ['Room', 'Board', 'Personal Care', 'Medication Management'], additionalFees: [] },
    amenities: { privateRooms: true, sharedRooms: true, privateBathroom: true, wheelchairAccessible: true, hospitalBeds: true, hoyerLift: true, walkInShower: true, emergencyCallSystem: true, securedMemoryCare: false, wanderPrevention: false, outdoorSpace: true, garden: false, petFriendly: false, petsOnSite: false, smokingAllowed: false, wifi: true, cableTV: true, airConditioning: true, homeCookedMeals: true, specialDiets: true, activities: true, transportation: false, laundry: true, housekeeping: true },
    staffing: { staffToResidentRatio: '1:3', rnHoursPerWeek: 8, lpnHoursPerWeek: 0, cnaCount: 2, overnightStaffAwake: true, bilingualStaff: false, languages: ['English'], specializedTraining: ['CPR', 'First Aid', 'Hoyer Lift'] },
    culturalServices: { languagesSpoken: ['English'], culturalFoods: [], religiousServices: false, religiousAffiliation: null, lgbtqFriendly: true, culturalActivities: [] },
  },
  {
    // Profile 5: Hospice-friendly
    specializations: { dementia: true, alzheimers: true, mentalHealth: false, developmentalDisabilities: false, parkinsons: true, diabetes: true, hospicePalliative: true, traumaticBrainInjury: false, dialysis: false, postSurgeryRehab: false, bariatric: false, youngAdults: false, veterans: false },
    medicalServices: { nursingCare24hr: false, rnOnSite: true, lpnOnSite: false, medicationManagement: true, medicationAdministration: true, injections: true, woundCare: true, catheterCare: true, ostomyCare: false, oxygenTherapy: true, cpapBipap: false, feedingTube: false, physicalTherapy: false, occupationalTherapy: false, speechTherapy: false, bloodGlucoseMonitoring: true, vitalSignsMonitoring: true, hospiceCoordination: true },
    adlCapabilities: { bathing: 'all-levels' as const, dressing: 'all-levels' as const, eating: 'all-levels' as const, mobility: 'bedridden' as const, toileting: 'all-levels' as const, transferring: 'hoyer-lift' as const, continence: 'all-levels' as const },
    paymentAccepted: { privatePay: true, medicaidCOPES: true, medicaidWaiver: false, medicare: true, longTermCareInsurance: true, vaAidAttendance: false, vaCommunityLiving: false, slidingScale: false, financialAssistance: false },
    pricing: { baseRateMin: 6000, baseRateMax: 9000, medicaidRate: 5000, additionalCareRates: { level1: 700, level2: 1400, level3: 2100 }, includesInPricing: ['Room', 'Board', 'Personal Care', 'Medication Management'], additionalFees: [] },
    amenities: { privateRooms: true, sharedRooms: false, privateBathroom: true, wheelchairAccessible: true, hospitalBeds: true, hoyerLift: true, walkInShower: true, emergencyCallSystem: true, securedMemoryCare: false, wanderPrevention: false, outdoorSpace: true, garden: true, petFriendly: false, petsOnSite: false, smokingAllowed: false, wifi: true, cableTV: true, airConditioning: true, homeCookedMeals: true, specialDiets: true, activities: false, transportation: false, laundry: true, housekeeping: true },
    staffing: { staffToResidentRatio: '1:2', rnHoursPerWeek: 20, lpnHoursPerWeek: 0, cnaCount: 3, overnightStaffAwake: true, bilingualStaff: false, languages: ['English'], specializedTraining: ['Hospice Care', 'CPR', 'First Aid', 'Wound Care'] },
    culturalServices: { languagesSpoken: ['English'], culturalFoods: [], religiousServices: true, religiousAffiliation: 'Non-denominational', lgbtqFriendly: true, culturalActivities: [] },
  },
  {
    // Profile 6: Budget-friendly
    specializations: { dementia: false, alzheimers: false, mentalHealth: false, developmentalDisabilities: false, parkinsons: false, diabetes: true, hospicePalliative: false, traumaticBrainInjury: false, dialysis: false, postSurgeryRehab: false, bariatric: false, youngAdults: false, veterans: false },
    medicalServices: { nursingCare24hr: false, rnOnSite: false, lpnOnSite: false, medicationManagement: true, medicationAdministration: true, injections: false, woundCare: false, catheterCare: false, ostomyCare: false, oxygenTherapy: false, cpapBipap: false, feedingTube: false, physicalTherapy: false, occupationalTherapy: false, speechTherapy: false, bloodGlucoseMonitoring: true, vitalSignsMonitoring: true, hospiceCoordination: false },
    adlCapabilities: { bathing: 'some-assistance' as const, dressing: 'some-assistance' as const, eating: 'some-assistance' as const, mobility: 'wheelchair' as const, toileting: 'some-assistance' as const, transferring: 'one-person' as const, continence: 'incontinent-ok' as const },
    paymentAccepted: { privatePay: true, medicaidCOPES: true, medicaidWaiver: false, medicare: false, longTermCareInsurance: false, vaAidAttendance: false, vaCommunityLiving: false, slidingScale: true, financialAssistance: true },
    pricing: { baseRateMin: 3500, baseRateMax: 5000, medicaidRate: 3200, additionalCareRates: { level1: 300, level2: 600, level3: 900 }, includesInPricing: ['Room', 'Board', 'Personal Care'], additionalFees: [] },
    amenities: { privateRooms: false, sharedRooms: true, privateBathroom: false, wheelchairAccessible: true, hospitalBeds: false, hoyerLift: false, walkInShower: true, emergencyCallSystem: true, securedMemoryCare: false, wanderPrevention: false, outdoorSpace: true, garden: false, petFriendly: false, petsOnSite: false, smokingAllowed: false, wifi: true, cableTV: true, airConditioning: true, homeCookedMeals: true, specialDiets: false, activities: true, transportation: false, laundry: true, housekeeping: true },
    staffing: { staffToResidentRatio: '1:4', rnHoursPerWeek: 0, lpnHoursPerWeek: 0, cnaCount: 2, overnightStaffAwake: false, bilingualStaff: false, languages: ['English'], specializedTraining: ['CPR', 'First Aid'] },
    culturalServices: { languagesSpoken: ['English'], culturalFoods: [], religiousServices: false, religiousAffiliation: null, lgbtqFriendly: true, culturalActivities: [] },
  },
  {
    // Profile 7: Premium/Luxury
    specializations: { dementia: true, alzheimers: true, mentalHealth: false, developmentalDisabilities: false, parkinsons: true, diabetes: true, hospicePalliative: false, traumaticBrainInjury: false, dialysis: false, postSurgeryRehab: false, bariatric: false, youngAdults: false, veterans: false },
    medicalServices: { nursingCare24hr: false, rnOnSite: true, lpnOnSite: false, medicationManagement: true, medicationAdministration: true, injections: true, woundCare: true, catheterCare: false, ostomyCare: false, oxygenTherapy: false, cpapBipap: false, feedingTube: false, physicalTherapy: true, occupationalTherapy: false, speechTherapy: false, bloodGlucoseMonitoring: true, vitalSignsMonitoring: true, hospiceCoordination: false },
    adlCapabilities: { bathing: 'all-levels' as const, dressing: 'all-levels' as const, eating: 'all-levels' as const, mobility: 'all-levels' as const, toileting: 'all-levels' as const, transferring: 'all-levels' as const, continence: 'all-levels' as const },
    paymentAccepted: { privatePay: true, medicaidCOPES: false, medicaidWaiver: false, medicare: false, longTermCareInsurance: true, vaAidAttendance: false, vaCommunityLiving: false, slidingScale: false, financialAssistance: false },
    pricing: { baseRateMin: 8000, baseRateMax: 12000, medicaidRate: null, additionalCareRates: { level1: 1000, level2: 2000, level3: 3000 }, includesInPricing: ['Room', 'Board', 'Personal Care', 'All Amenities'], additionalFees: [] },
    amenities: { privateRooms: true, sharedRooms: false, privateBathroom: true, wheelchairAccessible: true, hospitalBeds: true, hoyerLift: true, walkInShower: true, emergencyCallSystem: true, securedMemoryCare: true, wanderPrevention: true, outdoorSpace: true, garden: true, petFriendly: true, petsOnSite: true, smokingAllowed: false, wifi: true, cableTV: true, airConditioning: true, homeCookedMeals: true, specialDiets: true, activities: true, transportation: true, laundry: true, housekeeping: true },
    staffing: { staffToResidentRatio: '1:2', rnHoursPerWeek: 40, lpnHoursPerWeek: 0, cnaCount: 4, overnightStaffAwake: true, bilingualStaff: true, languages: ['English', 'Spanish'], specializedTraining: ['Dementia Care', 'CPR', 'First Aid', 'Physical Therapy Assistant'] },
    culturalServices: { languagesSpoken: ['English', 'Spanish'], culturalFoods: [], religiousServices: true, religiousAffiliation: null, lgbtqFriendly: true, culturalActivities: ['Art Therapy', 'Music Therapy'] },
  },
  {
    // Profile 8: Vietnamese-owned with cultural focus
    specializations: { dementia: true, alzheimers: false, mentalHealth: false, developmentalDisabilities: false, parkinsons: true, diabetes: true, hospicePalliative: false, traumaticBrainInjury: false, dialysis: false, postSurgeryRehab: false, bariatric: false, youngAdults: false, veterans: false },
    medicalServices: { nursingCare24hr: false, rnOnSite: false, lpnOnSite: false, medicationManagement: true, medicationAdministration: true, injections: false, woundCare: false, catheterCare: false, ostomyCare: false, oxygenTherapy: false, cpapBipap: false, feedingTube: false, physicalTherapy: false, occupationalTherapy: false, speechTherapy: false, bloodGlucoseMonitoring: true, vitalSignsMonitoring: true, hospiceCoordination: false },
    adlCapabilities: { bathing: 'all-levels' as const, dressing: 'all-levels' as const, eating: 'all-levels' as const, mobility: 'wheelchair' as const, toileting: 'all-levels' as const, transferring: 'two-person' as const, continence: 'all-levels' as const },
    paymentAccepted: { privatePay: true, medicaidCOPES: true, medicaidWaiver: false, medicare: false, longTermCareInsurance: false, vaAidAttendance: false, vaCommunityLiving: false, slidingScale: false, financialAssistance: false },
    pricing: { baseRateMin: 4800, baseRateMax: 6800, medicaidRate: 4000, additionalCareRates: { level1: 500, level2: 1000, level3: 1500 }, includesInPricing: ['Room', 'Board', 'Personal Care'], additionalFees: [] },
    amenities: { privateRooms: true, sharedRooms: true, privateBathroom: false, wheelchairAccessible: true, hospitalBeds: false, hoyerLift: false, walkInShower: true, emergencyCallSystem: true, securedMemoryCare: false, wanderPrevention: false, outdoorSpace: true, garden: true, petFriendly: false, petsOnSite: false, smokingAllowed: false, wifi: true, cableTV: true, airConditioning: true, homeCookedMeals: true, specialDiets: true, activities: true, transportation: true, laundry: true, housekeeping: true },
    staffing: { staffToResidentRatio: '1:3', rnHoursPerWeek: 0, lpnHoursPerWeek: 0, cnaCount: 2, overnightStaffAwake: true, bilingualStaff: true, languages: ['English', 'Vietnamese'], specializedTraining: ['CPR', 'First Aid', 'Dementia Care'] },
    culturalServices: { languagesSpoken: ['English', 'Vietnamese'], culturalFoods: ['Vietnamese', 'Asian'], religiousServices: true, religiousAffiliation: 'Buddhist', lgbtqFriendly: true, culturalActivities: ['Vietnamese Cultural Activities'] },
  },
  {
    // Profile 9: Spanish-speaking focus
    specializations: { dementia: true, alzheimers: true, mentalHealth: true, developmentalDisabilities: false, parkinsons: false, diabetes: true, hospicePalliative: false, traumaticBrainInjury: false, dialysis: false, postSurgeryRehab: false, bariatric: false, youngAdults: false, veterans: false },
    medicalServices: { nursingCare24hr: false, rnOnSite: false, lpnOnSite: false, medicationManagement: true, medicationAdministration: true, injections: true, woundCare: false, catheterCare: false, ostomyCare: false, oxygenTherapy: false, cpapBipap: false, feedingTube: false, physicalTherapy: false, occupationalTherapy: false, speechTherapy: false, bloodGlucoseMonitoring: true, vitalSignsMonitoring: true, hospiceCoordination: false },
    adlCapabilities: { bathing: 'all-levels' as const, dressing: 'all-levels' as const, eating: 'all-levels' as const, mobility: 'all-levels' as const, toileting: 'all-levels' as const, transferring: 'all-levels' as const, continence: 'all-levels' as const },
    paymentAccepted: { privatePay: true, medicaidCOPES: true, medicaidWaiver: true, medicare: false, longTermCareInsurance: false, vaAidAttendance: false, vaCommunityLiving: false, slidingScale: false, financialAssistance: false },
    pricing: { baseRateMin: 4500, baseRateMax: 6500, medicaidRate: 3800, additionalCareRates: { level1: 400, level2: 800, level3: 1200 }, includesInPricing: ['Room', 'Board', 'Personal Care'], additionalFees: [] },
    amenities: { privateRooms: true, sharedRooms: true, privateBathroom: false, wheelchairAccessible: true, hospitalBeds: false, hoyerLift: false, walkInShower: true, emergencyCallSystem: true, securedMemoryCare: false, wanderPrevention: false, outdoorSpace: true, garden: false, petFriendly: true, petsOnSite: false, smokingAllowed: false, wifi: true, cableTV: true, airConditioning: true, homeCookedMeals: true, specialDiets: true, activities: true, transportation: true, laundry: true, housekeeping: true },
    staffing: { staffToResidentRatio: '1:3', rnHoursPerWeek: 0, lpnHoursPerWeek: 0, cnaCount: 2, overnightStaffAwake: false, bilingualStaff: true, languages: ['English', 'Spanish'], specializedTraining: ['CPR', 'First Aid', 'Dementia Care'] },
    culturalServices: { languagesSpoken: ['English', 'Spanish'], culturalFoods: ['Mexican', 'Latin American'], religiousServices: true, religiousAffiliation: 'Catholic', lgbtqFriendly: true, culturalActivities: ['Hispanic Cultural Activities'] },
  },
  {
    // Profile 10: Veterans focus
    specializations: { dementia: true, alzheimers: true, mentalHealth: true, developmentalDisabilities: false, parkinsons: true, diabetes: true, hospicePalliative: true, traumaticBrainInjury: true, dialysis: false, postSurgeryRehab: false, bariatric: false, youngAdults: false, veterans: true },
    medicalServices: { nursingCare24hr: false, rnOnSite: true, lpnOnSite: false, medicationManagement: true, medicationAdministration: true, injections: true, woundCare: true, catheterCare: false, ostomyCare: false, oxygenTherapy: true, cpapBipap: false, feedingTube: false, physicalTherapy: false, occupationalTherapy: false, speechTherapy: false, bloodGlucoseMonitoring: true, vitalSignsMonitoring: true, hospiceCoordination: true },
    adlCapabilities: { bathing: 'all-levels' as const, dressing: 'all-levels' as const, eating: 'all-levels' as const, mobility: 'bedridden' as const, toileting: 'all-levels' as const, transferring: 'hoyer-lift' as const, continence: 'all-levels' as const },
    paymentAccepted: { privatePay: true, medicaidCOPES: true, medicaidWaiver: false, medicare: true, longTermCareInsurance: false, vaAidAttendance: true, vaCommunityLiving: true, slidingScale: false, financialAssistance: false },
    pricing: { baseRateMin: 5500, baseRateMax: 8500, medicaidRate: 4500, additionalCareRates: { level1: 600, level2: 1200, level3: 1800 }, includesInPricing: ['Room', 'Board', 'Personal Care', 'Medication Management'], additionalFees: [] },
    amenities: { privateRooms: true, sharedRooms: false, privateBathroom: true, wheelchairAccessible: true, hospitalBeds: true, hoyerLift: true, walkInShower: true, emergencyCallSystem: true, securedMemoryCare: false, wanderPrevention: false, outdoorSpace: true, garden: false, petFriendly: true, petsOnSite: false, smokingAllowed: false, wifi: true, cableTV: true, airConditioning: true, homeCookedMeals: true, specialDiets: true, activities: true, transportation: true, laundry: true, housekeeping: true },
    staffing: { staffToResidentRatio: '1:2', rnHoursPerWeek: 16, lpnHoursPerWeek: 0, cnaCount: 3, overnightStaffAwake: true, bilingualStaff: false, languages: ['English'], specializedTraining: ['CPR', 'First Aid', 'PTSD Support', 'Veteran Care'] },
    culturalServices: { languagesSpoken: ['English'], culturalFoods: [], religiousServices: true, religiousAffiliation: null, lgbtqFriendly: true, culturalActivities: ['Veteran Support Groups'] },
  },
];

async function seedData() {
  console.log("🌱 Starting seed process...\n");

  const hashedPassword = await hashPassword(PASSWORD);

  // Create 10 owners and facilities
  for (let i = 0; i < 10; i++) {
    const email = i === 0 ? "test@example.com" : `test${i}@example.com`;
    const ownerFirstName = randomFrom(firstNames);
    const ownerLastName = randomFrom(lastNames);
    const city = cities[i % cities.length];
    const county = counties[i % counties.length];
    const facilityName = facilityNames[i];

    console.log(`\n📍 Creating Facility ${i + 1}: ${facilityName}`);
    console.log(`   Owner: ${ownerFirstName} ${ownerLastName} (${email})`);

    // Check if owner exists
    const existingOwner = await db.query.owners.findFirst({
      where: eq(owners.email, email),
    });

    let ownerId: string;

    if (existingOwner) {
      console.log(`   ⚠️  Owner ${email} already exists, using existing...`);
      ownerId = existingOwner.id;
    } else {
      // Create owner
      const [owner] = await db.insert(owners).values({
        email,
        passwordHash: hashedPassword,
        name: `${ownerFirstName} ${ownerLastName}`,
        phone: `206-555-${String(1000 + i).slice(1)}`,
        status: "active",
        emailVerified: true,
      }).returning();

      ownerId = owner.id;
      console.log(`   ✅ Created owner: ${ownerFirstName} ${ownerLastName}`);
    }

    // Check if facility exists for this owner
    const existingFacility = await db.query.facilities.findFirst({
      where: eq(facilities.ownerId, ownerId),
    });

    let facilityId: string;
    const bedCount = randomBetween(4, 6);
    const capProfile = capabilityProfiles[i];

    if (existingFacility) {
      console.log(`   ⚠️  Facility already exists for owner, using existing...`);
      facilityId = existingFacility.id;
    } else {
      // Create facility
      const streetNum = randomBetween(100, 9999);
      const streetName = randomFrom(streetNames);

      const [facility] = await db.insert(facilities).values({
        ownerId,
        name: facilityName,
        slug: slugify(facilityName) + '-' + randomBetween(100, 999),
        facilityType: 'afh',
        licenseNumber: `AFH-${String(100000 + i * 1111).slice(1)}`,
        licenseStatus: 'Active',
        address: `${streetNum} ${streetName} St`,
        city,
        state: "WA",
        zipCode: `98${String(100 + i).slice(1)}`,
        county,
        phone: `206-555-${String(2000 + i).slice(1)}`,
        email: `info@${slugify(facilityName)}.com`,
        capacity: bedCount,
        availableBeds: bedCount,
        priceMin: capProfile.pricing.baseRateMin,
        priceMax: capProfile.pricing.baseRateMax,
        acceptsMedicaid: capProfile.paymentAccepted.medicaidCOPES,
        acceptsPrivatePay: capProfile.paymentAccepted.privatePay,
        specialties: specialtiesOptions[i],
        amenities: Object.entries(capProfile.amenities).filter(([_, v]) => v === true).map(([k]) => k),
        description: `${facilityName} is a warm, welcoming adult family home in ${city}. We provide personalized care in a home-like environment with specialized services.`,
        status: 'active',
        claimStatus: 'claimed',
        claimedAt: new Date(),
        featured: i < 3, // First 3 are featured
      }).returning();

      facilityId = facility.id;
      console.log(`   ✅ Created facility: ${facilityName} (${bedCount} beds)`);
    }

    // Create or update facility capabilities
    const existingCaps = await db.query.facilityCapabilities.findFirst({
      where: eq(facilityCapabilities.facilityId, facilityId),
    });

    if (!existingCaps) {
      try {
        await db.insert(facilityCapabilities).values({
          facilityId,
          careTypes: { afh: true, assistedLiving: false, skilledNursing: false, hospice: capProfile.specializations.hospicePalliative, respiteCare: i % 3 === 0, adultDaycare: false },
          specializations: capProfile.specializations,
          medicalServices: capProfile.medicalServices,
          adlCapabilities: capProfile.adlCapabilities,
          paymentAccepted: capProfile.paymentAccepted,
          pricing: capProfile.pricing,
          amenities: capProfile.amenities,
          staffing: capProfile.staffing,
          culturalServices: capProfile.culturalServices,
          availability: {
            totalBeds: bedCount,
            currentOccupancy: 0,
            availableBeds: bedCount,
            waitlistLength: 0,
            acceptingNewResidents: true,
            respiteCareAvailable: i % 3 === 0,
          },
          additionalInfo: {
            yearEstablished: 2010 + i,
            ownerOperatedOnSite: i % 2 === 0,
            visitingHours: '8am - 8pm',
            trialStayAvailable: true,
            minimumStayDays: 30,
            maxResidentAge: null,
            minResidentAge: 18,
          },
        });
        console.log(`   ✅ Created facility capabilities`);
      } catch (e) {
        console.log(`   ⚠️  Could not create capabilities: ${e}`);
      }
    }

    // Create residents (varying numbers: 2-6 per facility)
    const numResidents = randomBetween(2, Math.min(bedCount, 5));
    console.log(`   Creating ${numResidents} residents...`);

    for (let r = 0; r < numResidents; r++) {
      const residentFirstName = randomFrom(firstNames);
      const residentLastName = randomFrom(lastNames);
      const preferredName = r % 3 === 0 ? randomFrom(["Bobby", "Betty", "Jimmy", "Maggie", "Billy", "Susie"]) : null;

      // Random birthdate (65-95 years old)
      const age = randomBetween(65, 95);
      const birthYear = new Date().getFullYear() - age;
      const dateOfBirth = new Date(birthYear, randomBetween(0, 11), randomBetween(1, 28));

      // Random admission date (within last 3 years)
      const admissionDate = randomDate(
        new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000),
        new Date()
      );

      // Random diagnoses (1-3)
      const numDiagnoses = randomBetween(1, 3);
      const residentDiagnoses: string[] = [];
      for (let d = 0; d < numDiagnoses; d++) {
        residentDiagnoses.push(randomFrom(diagnoses));
      }

      try {
        await db.insert(residents).values({
          facilityId,
          firstName: residentFirstName,
          lastName: residentLastName,
          preferredName,
          dateOfBirth: dateOfBirth.toISOString().split('T')[0],
          roomNumber: String(r + 1),
          admissionDate: admissionDate.toISOString().split('T')[0],
          status: randomFrom(["active", "active", "active", "hospital"]), // 75% active
          diagnoses: residentDiagnoses,
          allergies: [randomFrom(allergies)],
          codeStatus: randomFrom(codeStatuses),
          emergencyContacts: [{
            name: `${randomFrom(firstNames)} ${residentLastName}`,
            phone: `206-555-${String(randomBetween(1000, 9999))}`,
            relationship: randomFrom(["Son", "Daughter", "Spouse", "Niece", "Nephew", "Friend"]),
            isPrimary: true,
          }],
          insuranceInfo: capProfile.paymentAccepted.medicaidCOPES ? {
            medicaidId: `WA${String(randomBetween(100000000, 999999999))}`,
          } : undefined,
        });
        console.log(`      ✅ Resident: ${residentFirstName} ${residentLastName} (Room ${r + 1})`);
      } catch (e) {
        console.log(`      ⚠️  Could not create resident: ${e}`);
      }
    }

    // Create team members/staff (varying numbers: 2-5 per facility)
    const numStaff = randomBetween(2, 5);
    console.log(`   Creating ${numStaff} staff members...`);

    for (let s = 0; s < numStaff; s++) {
      const staffFirstName = randomFrom(firstNames);
      const staffLastName = randomFrom(lastNames);
      const role = s === 0 ? "Lead Caregiver" : randomFrom(staffRoles);

      // Random hire date (within last 5 years)
      const hireDate = randomDate(
        new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
        new Date()
      );

      try {
        // Create team member
        const [teamMember] = await db.insert(teamMembers).values({
          facilityId,
          name: `${staffFirstName} ${staffLastName}`,
          email: `${staffFirstName.toLowerCase()}.${staffLastName.toLowerCase()}${i}@example.com`,
          phone: `206-555-${String(randomBetween(1000, 9999))}`,
          role,
          hireDate: hireDate.toISOString().split('T')[0],
          status: "Active",
          isManualEntry: true,
        }).returning();

        // Create staff auth for this team member
        const staffEmail = `${staffFirstName.toLowerCase()}.${staffLastName.toLowerCase()}${i}@example.com`;
        const pinHash = await hashPassword(String(1000 + s));

        await db.insert(staffAuth).values({
          facilityId,
          teamMemberId: teamMember.id,
          email: staffEmail,
          passwordHash: hashedPassword,
          pin: pinHash,
          firstName: staffFirstName,
          lastName: staffLastName,
          role: role.toLowerCase().replace(/ /g, '_'),
          status: "active",
          permissions: {
            canViewResidents: true,
            canEditResidents: s === 0,
            canViewMedications: true,
            canAdministerMeds: true,
            canAdministerControlled: s === 0,
            canFileIncidents: true,
          },
        }).onConflictDoNothing();

        console.log(`      ✅ Staff: ${staffFirstName} ${staffLastName} (${role})`);
      } catch (e) {
        console.log(`      ⚠️  Could not create staff: ${e}`);
      }
    }

    // Update facility occupancy in capabilities
    try {
      await db.update(facilityCapabilities)
        .set({
          availability: {
            totalBeds: bedCount,
            currentOccupancy: numResidents,
            availableBeds: bedCount - numResidents,
            waitlistLength: 0,
            acceptingNewResidents: bedCount > numResidents,
            respiteCareAvailable: i % 3 === 0,
          },
          updatedAt: new Date(),
        })
        .where(eq(facilityCapabilities.facilityId, facilityId));

      // Also update facility availableBeds
      await db.update(facilities)
        .set({
          availableBeds: bedCount - numResidents,
          updatedAt: new Date(),
        })
        .where(eq(facilities.id, facilityId));
    } catch (e) {
      // Ignore if table doesn't exist
    }
  }

  console.log("\n\n✨ Seed completed successfully!\n");
  console.log("📋 Summary:");
  console.log("   - 10 Adult Family Homes created");
  console.log("   - 10 Owner accounts (test@example.com through test9@example.com)");
  console.log("   - Password for all: test123");
  console.log("   - Various resident and staff counts per facility");
  console.log("   - Different specializations and capabilities per facility\n");

  console.log("🔐 Login credentials:");
  for (let i = 0; i < 10; i++) {
    const email = i === 0 ? "test@example.com" : `test${i}@example.com`;
    console.log(`   ${email} / test123`);
  }
}

// Run the seed
seedData()
  .then(() => {
    console.log("\n👋 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
