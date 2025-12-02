import heroImage from '@assets/generated_images/elderly_woman_and_caregiver_smiling_in_a_sunlit_garden.png';
import house1 from '@assets/generated_images/modern_suburban_family_home_exterior_with_garden.png';
import house2 from '@assets/generated_images/cozy_residential_care_home_exterior_with_porch.png';
import house3 from '@assets/generated_images/modern_adult_family_home_with_large_windows.png';

export interface Inspection {
  date: string;
  type: string;
  result: string;
  violations: number;
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  price_min: number;
  price_max: number;
  beds_available: number;
  capacity: number;
  images: string[];
  specialties: string[];
  services: string[];
  license_status: 'Active' | 'Inactive' | 'Probation';
  license_number: string;
  licensed_since: string;
  violations_24m: number;
  last_inspection_date: string;
  last_inspection_result: 'Pass' | 'Fail' | 'Corrections Needed';
  inspection_history: Inspection[];
  is_dshs_verified: boolean;
  is_claimed: boolean;
  has_okapi_certified_staff: boolean;
  description: string;
  administrator: string;
  languages: string[];
  payment_types: string[];
}

export const MOCK_FACILITIES: Facility[] = [
  {
    id: "1",
    name: "Sunshine Adult Family Home",
    address: "123 Maple Avenue",
    city: "Bellevue",
    zip: "98004",
    price_min: 4500,
    price_max: 6000,
    beds_available: 1,
    capacity: 6,
    images: [house1, house2, house3],
    specialties: ["Memory Care", "Dementia"],
    services: ["24/7 Supervision", "Medication Management", "Home Cooked Meals", "Housekeeping", "Laundry Service", "Bathing Assistance"],
    license_status: "Active",
    license_number: "AFH-2023-001",
    licensed_since: "2015-03-12",
    violations_24m: 0,
    last_inspection_date: "2024-11-15",
    last_inspection_result: "Pass",
    inspection_history: [
      { date: "2024-11-15", type: "Routine", result: "No violations found", violations: 0 },
      { date: "2023-10-02", type: "Routine", result: "No violations found", violations: 0 },
      { date: "2022-09-20", type: "Complaint", result: "Unsubstantiated", violations: 0 }
    ],
    is_dshs_verified: true,
    is_claimed: true,
    has_okapi_certified_staff: true,
    description: "Sunshine AFH specializes in memory care with a warm, home-like environment. Our staff are specially trained in dementia care and provide 24/7 support to ensure safety and comfort for all residents.",
    administrator: "Sarah Johnson",
    languages: ["English", "Tagalog"],
    payment_types: ["Private Pay", "LTC Insurance"]
  },
  {
    id: "2",
    name: "Evergreen Senior Living",
    address: "456 Pine Street",
    city: "Redmond",
    zip: "98052",
    price_min: 5000,
    price_max: 7500,
    beds_available: 2,
    capacity: 6,
    images: [house2, house3, house1],
    specialties: ["Hospice", "High Acuity"],
    services: ["Visiting Nurse", "Hospice Care Coordination", "Medication Management", "Private Rooms", "Transportation Arrangement"],
    license_status: "Active",
    license_number: "AFH-2023-045",
    licensed_since: "2018-06-20",
    violations_24m: 0,
    last_inspection_date: "2024-10-01",
    last_inspection_result: "Pass",
    inspection_history: [
      { date: "2024-10-01", type: "Routine", result: "No violations found", violations: 0 },
      { date: "2023-09-15", type: "Routine", result: "No violations found", violations: 0 }
    ],
    is_dshs_verified: true,
    is_claimed: true,
    has_okapi_certified_staff: true,
    description: "Located in a quiet neighborhood in Redmond, Evergreen Senior Living offers premium care for residents with high acuity needs. We have a visiting nurse and spacious private rooms.",
    administrator: "David Chen",
    languages: ["English", "Mandarin"],
    payment_types: ["Private Pay", "Medicaid"]
  },
  {
    id: "3",
    name: "Cedar Valley Care Home",
    address: "789 Cedar Lane",
    city: "Kirkland",
    zip: "98033",
    price_min: 3800,
    price_max: 5500,
    beds_available: 0,
    capacity: 5,
    images: [house3, house1, house2],
    specialties: ["Mental Health", "Developmental Disabilities"],
    services: ["Behavioral Support", "Community Integration", "Medication Management", "Life Skills Training"],
    license_status: "Active",
    license_number: "AFH-2023-102",
    licensed_since: "2020-01-15",
    violations_24m: 1,
    last_inspection_date: "2024-09-10",
    last_inspection_result: "Corrections Needed",
    inspection_history: [
      { date: "2024-09-10", type: "Routine", result: "1 violation found (corrected)", violations: 1 },
      { date: "2023-08-05", type: "Routine", result: "No violations found", violations: 0 }
    ],
    is_dshs_verified: true,
    is_claimed: false,
    has_okapi_certified_staff: false,
    description: "Cedar Valley provides a supportive community for adults with developmental disabilities. We focus on independence and community integration.",
    administrator: "Maria Rodriguez",
    languages: ["English", "Spanish"],
    payment_types: ["Medicaid", "Private Pay"]
  },
  {
    id: "4",
    name: "Lakeview Manor",
    address: "321 Lake Drive",
    city: "Seattle",
    zip: "98115",
    price_min: 6000,
    price_max: 9000,
    beds_available: 1,
    capacity: 6,
    images: [house1, house3],
    specialties: ["Memory Care", "Parkinson's"],
    services: ["Physical Therapy Room", "Organic Meals", "Pet Therapy", "24/7 Awakening Staff"],
    license_status: "Active",
    license_number: "AFH-2023-221",
    licensed_since: "2010-11-05",
    violations_24m: 0,
    last_inspection_date: "2025-01-05",
    last_inspection_result: "Pass",
    inspection_history: [
       { date: "2025-01-05", type: "Routine", result: "No violations found", violations: 0 },
       { date: "2023-12-12", type: "Routine", result: "No violations found", violations: 0 }
    ],
    is_dshs_verified: true,
    is_claimed: true,
    has_okapi_certified_staff: true,
    description: "Lakeview Manor offers luxury accommodations with lake views. We provide specialized care for Parkinson's patients and have an on-site physical therapy room.",
    administrator: "James Wilson",
    languages: ["English"],
    payment_types: ["Private Pay"]
  },
  {
    id: "5",
    name: "Tranquil Gardens",
    address: "555 Rose Way",
    city: "Renton",
    zip: "98057",
    price_min: 4000,
    price_max: 5000,
    beds_available: 2,
    capacity: 6,
    images: [house2, house1],
    specialties: ["General Care", "Diabetes Management"],
    services: ["Diabetic Diet Planning", "Insulin Administration", "Activity Program", "Garden Access"],
    license_status: "Active",
    license_number: "AFH-2023-333",
    licensed_since: "2019-08-22",
    violations_24m: 0,
    last_inspection_date: "2024-12-12",
    last_inspection_result: "Pass",
    inspection_history: [
       { date: "2024-12-12", type: "Routine", result: "No violations found", violations: 0 },
       { date: "2023-11-20", type: "Routine", result: "No violations found", violations: 0 }
    ],
    is_dshs_verified: true,
    is_claimed: false,
    has_okapi_certified_staff: false,
    description: "Affordable, high-quality care in Renton. We specialize in diabetes management and healthy meal planning.",
    administrator: "Linda Kim",
    languages: ["English", "Korean"],
    payment_types: ["Medicaid", "Private Pay", "VA Benefits"]
  },
  {
    id: "6",
    name: "Harbor View Home",
    address: "999 Ocean Ave",
    city: "Tacoma",
    zip: "98407",
    price_min: 4200,
    price_max: 5800,
    beds_available: 1,
    capacity: 6,
    images: [house3, house2],
    specialties: ["Respite", "Hospice"],
    services: ["Palliative Care", "Family Support", "Short-term Stays", "Comfort Care"],
    license_status: "Active",
    license_number: "AFH-2023-444",
    licensed_since: "2016-05-30",
    violations_24m: 2,
    last_inspection_date: "2024-08-20",
    last_inspection_result: "Corrections Needed",
    inspection_history: [
       { date: "2024-08-20", type: "Routine", result: "2 violations found (corrected)", violations: 2 },
       { date: "2023-07-15", type: "Routine", result: "No violations found", violations: 0 }
    ],
    is_dshs_verified: true,
    is_claimed: true,
    has_okapi_certified_staff: true,
    description: "Harbor View provides compassionate hospice and respite care. We work closely with local hospice agencies to ensure comfort and dignity.",
    administrator: "Robert Smith",
    languages: ["English"],
    payment_types: ["Private Pay", "Medicaid"]
  },
  {
    id: "7",
    name: "Queen Anne Hill House",
    address: "2400 1st Ave N",
    city: "Seattle",
    zip: "98109",
    price_min: 7000,
    price_max: 9500,
    beds_available: 0,
    capacity: 6,
    images: [house1, house2],
    specialties: ["Memory Care", "Stroke Recovery"],
    services: ["Physical Therapy Coordination", "Speech Therapy Support", "Premium Meals", "City Views"],
    license_status: "Active",
    license_number: "AFH-2023-555",
    licensed_since: "2012-04-10",
    violations_24m: 0,
    last_inspection_date: "2024-11-01",
    last_inspection_result: "Pass",
    inspection_history: [
      { date: "2024-11-01", type: "Routine", result: "No violations found", violations: 0 },
      { date: "2023-10-15", type: "Routine", result: "No violations found", violations: 0 }
    ],
    is_dshs_verified: true,
    is_claimed: true,
    has_okapi_certified_staff: true,
    description: "Situated on Queen Anne Hill, we offer a premium living experience with stunning views of the Space Needle. We specialize in stroke recovery and memory care.",
    administrator: "Jennifer Wu",
    languages: ["English", "Cantonese"],
    payment_types: ["Private Pay", "LTC Insurance"]
  },
  {
    id: "8",
    name: "Valley View Estate",
    address: "888 Valley Rd",
    city: "Kent",
    zip: "98032",
    price_min: 3500,
    price_max: 4500,
    beds_available: 3,
    capacity: 6,
    images: [house2, house3],
    specialties: ["General Care", "Respite"],
    services: ["Recreational Activities", "Transportation", "Shared Rooms Available", "Medication Assistance"],
    license_status: "Active",
    license_number: "AFH-2023-666",
    licensed_since: "2021-02-28",
    violations_24m: 0,
    last_inspection_date: "2024-06-15",
    last_inspection_result: "Pass",
    inspection_history: [
      { date: "2024-06-15", type: "Routine", result: "No violations found", violations: 0 }
    ],
    is_dshs_verified: true,
    is_claimed: false,
    has_okapi_certified_staff: false,
    description: "Valley View Estate offers affordable, quality care in a spacious home setting. We have a large backyard and organize regular recreational activities.",
    administrator: "Thomas Brown",
    languages: ["English"],
    payment_types: ["Medicaid", "Private Pay"]
  }
];

export const HERO_IMAGE = heroImage;
