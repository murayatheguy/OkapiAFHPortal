import heroImage from '@assets/generated_images/elderly_woman_and_caregiver_smiling_in_a_sunlit_garden.png';
import house1 from '@assets/generated_images/modern_suburban_family_home_exterior_with_garden.png';
import house2 from '@assets/generated_images/cozy_residential_care_home_exterior_with_porch.png';
import house3 from '@assets/generated_images/modern_adult_family_home_with_large_windows.png';

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
  license_status: 'Active' | 'Inactive' | 'Probation';
  license_number: string;
  licensed_since: string;
  violations_24m: number;
  last_inspection: string;
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
    license_status: "Active",
    license_number: "AFH-2023-001",
    licensed_since: "2015-03-12",
    violations_24m: 0,
    last_inspection: "2024-11-15",
    is_dshs_verified: true,
    is_claimed: true,
    has_okapi_certified_staff: true,
    description: "Sunshine AFH specializes in memory care with a warm, home-like environment. Our staff are specially trained in dementia care and provide 24/7 support.",
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
    license_status: "Active",
    license_number: "AFH-2023-045",
    licensed_since: "2018-06-20",
    violations_24m: 0,
    last_inspection: "2024-10-01",
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
    license_status: "Active",
    license_number: "AFH-2023-102",
    licensed_since: "2020-01-15",
    violations_24m: 1,
    last_inspection: "2024-09-10",
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
    license_status: "Active",
    license_number: "AFH-2023-221",
    licensed_since: "2010-11-05",
    violations_24m: 0,
    last_inspection: "2025-01-05",
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
    license_status: "Active",
    license_number: "AFH-2023-333",
    licensed_since: "2019-08-22",
    violations_24m: 0,
    last_inspection: "2024-12-12",
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
    license_status: "Active",
    license_number: "AFH-2023-444",
    licensed_since: "2016-05-30",
    violations_24m: 2,
    last_inspection: "2024-08-20",
    is_dshs_verified: true,
    is_claimed: true,
    has_okapi_certified_staff: true,
    description: "Harbor View provides compassionate hospice and respite care. We work closely with local hospice agencies to ensure comfort and dignity.",
    administrator: "Robert Smith",
    languages: ["English"],
    payment_types: ["Private Pay", "Medicaid"]
  }
];

export const HERO_IMAGE = heroImage;
