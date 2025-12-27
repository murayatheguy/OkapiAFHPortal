/**
 * Okapi Care Network Constants
 * Platform focused exclusively on Adult Family Homes in Washington State
 */

export const BRAND = {
  name: "Okapi",
  fullName: "Okapi Care Network",
  tagline: "Find the Right Home for Mom or Dad",
  description: "Because finding care for someone you love shouldn't be so hard.",
  shortDescription: "Find the right AFH for your loved one",

  // Focus
  facilityType: "Adult Family Home",
  facilityTypeShort: "AFH",
  facilityTypePlural: "Adult Family Homes",

  // Geography
  state: "Washington",
  stateCode: "WA",
  regulator: "DSHS",

  // AFH-specific constraints (WA State)
  maxBeds: 6,
  minBeds: 1,
  defaultBeds: 6,

  // Matching (honest language)
  matchTime: "3 minutes",
  matchFactors: "50+",

  // Contact
  supportEmail: "support@okapicare.com",

  // Legal
  licensePrefix: "AFH-",
};

// Care need categories for matching (emotional, clear language)
export const CARE_NEEDS = [
  { id: "memory", label: "Memory Care", icon: "🧠", description: "Dementia, Alzheimer's" },
  { id: "medication", label: "Medication Help", icon: "💊", description: "Daily medication management" },
  { id: "daily-living", label: "Daily Living Help", icon: "🚿", description: "Bathing, dressing, grooming" },
  { id: "medical", label: "Medical Needs", icon: "🩺", description: "Diabetes, wound care, etc." },
  { id: "mental-health", label: "Mental Health", icon: "💭", description: "Behavioral support" },
  { id: "hospice", label: "Hospice Care", icon: "❤️", description: "End of life care" },
  { id: "general", label: "General Care", icon: "🏠", description: "Companionship, supervision, light help" },
];

// Mobility levels for matching
export const MOBILITY_LEVELS = [
  { id: "independent", label: "Walks on their own", icon: "🚶" },
  { id: "walker", label: "Uses a walker or cane", icon: "🦯" },
  { id: "wheelchair", label: "Uses a wheelchair", icon: "🦽" },
  { id: "bedridden", label: "Mostly in bed", icon: "🛏️" },
];

// Budget options for matching
export const BUDGET_OPTIONS = [
  { id: "medicaid", label: "Medicaid / COPES", description: "State-funded assistance" },
  { id: "under-5k", label: "Under $5,000/month", description: "Private pay" },
  { id: "5k-8k", label: "$5,000 - $8,000/month", description: "Private pay" },
  { id: "over-8k", label: "Over $8,000/month", description: "Private pay" },
  { id: "unsure", label: "I'm not sure yet", description: "We can help figure it out" },
];

// Timeline options for matching
export const TIMELINE_OPTIONS = [
  { id: "urgent", label: "ASAP", icon: "🚨" },
  { id: "weeks", label: "Next few weeks", icon: "📅" },
  { id: "planning", label: "Just planning", icon: "🔮" },
];

// Care specializations available for AFHs
export const AFH_SPECIALIZATIONS = [
  { id: "general", label: "General Care", description: "Standard adult family home care" },
  { id: "dementia", label: "Dementia & Alzheimer's", description: "Memory care specialization" },
  { id: "mental-health", label: "Mental Health", description: "Behavioral and psychiatric support" },
  { id: "developmental-disabilities", label: "Developmental Disabilities", description: "DD/IDD care" },
  { id: "hospice", label: "Hospice & Palliative", description: "End-of-life care" },
  { id: "veterans", label: "Veterans Care", description: "Specialized care for veterans" },
  { id: "bariatric", label: "Bariatric Care", description: "Care for higher weight residents" },
  { id: "diabetes", label: "Diabetes Management", description: "Specialized diabetes care" },
  { id: "stroke-recovery", label: "Stroke Recovery", description: "Post-stroke rehabilitation" },
  { id: "parkinsons", label: "Parkinson's Disease", description: "Movement disorder care" },
];

// Payment types accepted by WA AFHs
export const PAYMENT_TYPES = [
  { id: "private-pay", label: "Private Pay" },
  { id: "medicaid-copes", label: "Medicaid COPES" },
  { id: "medicaid-aau", label: "Medicaid AAU" },
  { id: "ltc-insurance", label: "Long-Term Care Insurance" },
  { id: "va-aid-attendance", label: "VA Aid & Attendance" },
  { id: "va-community-living", label: "VA Community Living" },
];

// ADL assistance levels
export const ADL_LEVELS = [
  { id: "independent", label: "Independent", description: "Reminder/supervision only" },
  { id: "minimal", label: "Minimal Assist", description: "Some hands-on help" },
  { id: "moderate", label: "Moderate Assist", description: "Significant help needed" },
  { id: "total", label: "Total Care", description: "Full assistance required" },
];

// Common diagnoses in AFH settings
export const COMMON_DIAGNOSES = [
  "Alzheimer's Disease",
  "Vascular Dementia",
  "Lewy Body Dementia",
  "Parkinson's Disease",
  "Stroke/CVA",
  "Type 2 Diabetes",
  "Hypertension",
  "COPD",
  "Congestive Heart Failure",
  "Depression",
  "Anxiety",
  "Bipolar Disorder",
  "Schizophrenia",
  "Intellectual Disability",
  "Down Syndrome",
  "Traumatic Brain Injury",
  "Multiple Sclerosis",
  "ALS",
  "Chronic Kidney Disease",
  "Cancer",
];

// Washington State specific
export const WA_DSHS = {
  name: "Department of Social and Health Services",
  abbreviation: "DSHS",
  division: "Aging and Long-Term Support Administration (ALTSA)",
  websiteUrl: "https://www.dshs.wa.gov/altsa",
  providerSearchUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHPubLookup.aspx",

  // Required forms
  forms: [
    { id: "ncp", name: "Negotiated Care Plan", number: "DSHS 10-508" },
    { id: "disclosure", name: "Disclosure of Services", number: "DSHS 15-449" },
    { id: "nurse-delegation", name: "Nurse Delegation", number: "DSHS 01-212" },
    { id: "medication-log", name: "Medication Administration Record" },
    { id: "incident-report", name: "Incident Report", number: "DSHS 15-489" },
  ],

  // Regulations
  wac: "WAC 388-76", // Adult Family Home regulations
  rcw: "RCW 70.128", // Adult Family Homes chapter
};

// Cities in Washington (for search/filter)
export const WA_CITIES = [
  "Seattle",
  "Spokane",
  "Tacoma",
  "Vancouver",
  "Bellevue",
  "Kent",
  "Everett",
  "Renton",
  "Federal Way",
  "Spokane Valley",
  "Kirkland",
  "Bellingham",
  "Auburn",
  "Kennewick",
  "Redmond",
  "Marysville",
  "Pasco",
  "Lakewood",
  "Sammamish",
  "Richland",
  "Burien",
  "Olympia",
  "Lacey",
  "Edmonds",
  "Bremerton",
  "Yakima",
  "Bothell",
  "Puyallup",
  "Lynnwood",
  "Longview",
];

// Washington counties
export const WA_COUNTIES = [
  "King",
  "Pierce",
  "Snohomish",
  "Spokane",
  "Clark",
  "Thurston",
  "Kitsap",
  "Yakima",
  "Whatcom",
  "Benton",
  "Skagit",
  "Cowlitz",
  "Grant",
  "Franklin",
  "Island",
  "Lewis",
  "Chelan",
  "Clallam",
  "Walla Walla",
  "Douglas",
];
