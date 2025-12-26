// Types for the Smart Care Matching System

export type CareType = 'afh' | 'alf' | 'snf' | 'hospice' | 'any';

export type MedicalNeed =
  | 'dementia'
  | 'diabetes'
  | 'mobility'
  | 'medication_management'
  | 'wound_care'
  | 'mental_health'
  | 'developmental_disabilities'
  | 'oxygen'
  | 'dialysis'
  | 'tube_feeding';

export type DailyHelp =
  | 'bathing'
  | 'dressing'
  | 'toileting'
  | 'eating'
  | 'transfers'
  | 'walking';

export type Preference =
  | 'private_room'
  | 'pets_allowed'
  | 'outdoor_space'
  | 'religious'
  | 'cultural'
  | 'dietary';

export type Timeline = 'immediate' | 'within_month' | 'within_3_months' | 'planning';

export interface CareNeeds {
  careType: CareType;
  medicalNeeds: MedicalNeed[];
  dailyHelp: DailyHelp[];
  location: {
    city?: string;
    zipCode?: string;
    maxDistance: number; // miles
  };
  budget: {
    min: number;
    max: number;
    hasInsurance: boolean;
    hasMedicaid: boolean;
  };
  preferences: Preference[];
  timeline: Timeline;
}

export interface MatchReason {
  category: 'specialty' | 'services' | 'location' | 'price' | 'availability';
  positive: boolean;
  text: string;
  weight: number;
}

export interface MatchScore {
  overall: number; // 0-100
  breakdown: {
    careMatch: number;
    locationMatch: number;
    budgetMatch: number;
    servicesMatch: number;
    availabilityMatch: number;
  };
  reasons: MatchReason[];
}

export interface FacilityWithMatch {
  id: string;
  name: string;
  city: string;
  zipCode: string;
  facilityType: string;
  capacity: number;
  availableBeds: number;
  priceMin: number;
  priceMax: number;
  specialties: string[];
  amenities: string[];
  rating?: number;
  reviewCount?: number;
  photos?: string[];
  matchScore: MatchScore;
}

export const WIZARD_STEPS = [
  { id: 'care-type', title: 'Type of Care', description: 'What level of care do you need?' },
  { id: 'medical-needs', title: 'Medical Needs', description: 'Any specific medical conditions?' },
  { id: 'daily-help', title: 'Daily Assistance', description: 'Help with daily activities?' },
  { id: 'location', title: 'Location', description: 'Where are you looking?' },
  { id: 'budget', title: 'Budget', description: 'Your price range' },
  { id: 'preferences', title: 'Preferences', description: 'Additional preferences' },
  { id: 'timeline', title: 'Timeline', description: 'When do you need care?' },
] as const;

export type WizardStep = typeof WIZARD_STEPS[number]['id'];

export const CARE_TYPE_OPTIONS = [
  { value: 'afh', label: 'Adult Family Home', description: 'Residential home with 2-6 residents, personalized care', icon: 'Home' },
  { value: 'alf', label: 'Assisted Living', description: 'Community setting with 20-100+ residents', icon: 'Building2' },
  { value: 'snf', label: 'Skilled Nursing', description: 'Medical care facility with nursing staff 24/7', icon: 'Hospital' },
  { value: 'hospice', label: 'Hospice Care', description: 'End-of-life comfort and support', icon: 'Heart' },
  { value: 'any', label: 'Not Sure Yet', description: "Help me find what's best", icon: 'HelpCircle' },
] as const;

export const MEDICAL_NEED_OPTIONS = [
  { value: 'dementia', label: 'Memory Care / Dementia', icon: 'Brain' },
  { value: 'diabetes', label: 'Diabetes Management', icon: 'Pill' },
  { value: 'mobility', label: 'Mobility Assistance', icon: 'Accessibility' },
  { value: 'medication_management', label: 'Medication Management', icon: 'Pills' },
  { value: 'wound_care', label: 'Wound Care', icon: 'Bandage' },
  { value: 'mental_health', label: 'Mental Health Support', icon: 'HeartPulse' },
  { value: 'developmental_disabilities', label: 'Developmental Disabilities', icon: 'Users' },
  { value: 'oxygen', label: 'Oxygen Therapy', icon: 'Wind' },
  { value: 'dialysis', label: 'Dialysis Support', icon: 'Activity' },
  { value: 'tube_feeding', label: 'Tube Feeding', icon: 'Utensils' },
] as const;

export const DAILY_HELP_OPTIONS = [
  { value: 'bathing', label: 'Bathing / Showering', icon: 'Droplets' },
  { value: 'dressing', label: 'Getting Dressed', icon: 'Shirt' },
  { value: 'toileting', label: 'Toileting', icon: 'Bath' },
  { value: 'eating', label: 'Eating / Feeding', icon: 'UtensilsCrossed' },
  { value: 'transfers', label: 'Transfers (Bed/Chair)', icon: 'ArrowUpDown' },
  { value: 'walking', label: 'Walking / Moving Around', icon: 'Footprints' },
] as const;

export const PREFERENCE_OPTIONS = [
  { value: 'private_room', label: 'Private Room', icon: 'DoorClosed' },
  { value: 'pets_allowed', label: 'Pet-Friendly', icon: 'PawPrint' },
  { value: 'outdoor_space', label: 'Outdoor Space / Garden', icon: 'TreePine' },
  { value: 'religious', label: 'Religious Services', icon: 'Church' },
  { value: 'cultural', label: 'Cultural Considerations', icon: 'Globe' },
  { value: 'dietary', label: 'Special Dietary Needs', icon: 'Salad' },
] as const;

export const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediately', description: 'Within the next week', urgency: 'high' },
  { value: 'within_month', label: 'Within a Month', description: 'In the next 2-4 weeks', urgency: 'medium' },
  { value: 'within_3_months', label: 'Within 3 Months', description: 'Planning ahead', urgency: 'low' },
  { value: 'planning', label: 'Just Planning', description: 'Exploring options for the future', urgency: 'none' },
] as const;

export const DEFAULT_CARE_NEEDS: CareNeeds = {
  careType: 'any',
  medicalNeeds: [],
  dailyHelp: [],
  location: {
    city: '',
    zipCode: '',
    maxDistance: 25,
  },
  budget: {
    min: 0,
    max: 10000,
    hasInsurance: false,
    hasMedicaid: false,
  },
  preferences: [],
  timeline: 'within_month',
};
