/**
 * Test Facility Configurations
 *
 * This file defines the UNIQUE properties of each test facility.
 * Structure and patterns come from template.ts.
 */

import type { Specialty } from "./template";

export interface FacilityConfig {
  id: string;
  name: string;
  city: string;
  county: string;
  specialty?: Specialty;
  description?: string;
  owner: {
    email: string;
    name: string;
    phone?: string;
  };
  overrides?: {
    bedCount?: number;
    residentCount?: number;
    staffCount?: number;
  };
}

/**
 * Test Facilities to Create
 *
 * All use password: test123
 */
export const FACILITY_CONFIGS: FacilityConfig[] = [
  {
    id: "test-afh-001",
    name: "Test Adult Family Home",
    city: "Seattle",
    county: "King",
    specialty: undefined,
    description: "Our flagship test facility providing comprehensive care services.",
    owner: {
      email: "test@example.com",
      name: "Test Owner",
      phone: "206-555-0001",
    },
    overrides: {
      bedCount: 6,
      residentCount: 2,
      staffCount: 2,
    },
  },
  {
    id: "test-afh-002",
    name: "Sunrise Memory Care",
    city: "Tacoma",
    county: "Pierce",
    specialty: "dementia",
    description: "Specialized memory care for residents with Alzheimer's and dementia.",
    owner: {
      email: "test1@example.com",
      name: "Sarah Johnson",
      phone: "206-555-0002",
    },
  },
  {
    id: "test-afh-003",
    name: "Harmony Mental Health Home",
    city: "Bellevue",
    county: "King",
    specialty: "mentalHealth",
    description: "Supportive environment for residents with mental health needs.",
    owner: {
      email: "test2@example.com",
      name: "Michael Chen",
      phone: "206-555-0003",
    },
  },
  {
    id: "test-afh-004",
    name: "Golden Hearts DD Care",
    city: "Everett",
    county: "Snohomish",
    specialty: "developmentalDisabilities",
    description: "Person-centered care for adults with developmental disabilities.",
    owner: {
      email: "test3@example.com",
      name: "Emily Williams",
      phone: "206-555-0004",
    },
  },
  {
    id: "test-afh-005",
    name: "Comfort Hospice Home",
    city: "Kent",
    county: "King",
    specialty: "hospice",
    description: "Compassionate end-of-life care in a peaceful home setting.",
    owner: {
      email: "test4@example.com",
      name: "Robert Martinez",
      phone: "206-555-0005",
    },
  },
  {
    id: "test-afh-006",
    name: "Evergreen Senior Living",
    city: "Renton",
    county: "King",
    specialty: "budget",
    description: "Quality affordable care for seniors on a budget.",
    owner: {
      email: "test5@example.com",
      name: "Linda Davis",
      phone: "206-555-0006",
    },
  },
  {
    id: "test-afh-007",
    name: "Prestige Estates AFH",
    city: "Kirkland",
    county: "King",
    specialty: "premium",
    description: "Luxury care with premium amenities and personalized service.",
    owner: {
      email: "test6@example.com",
      name: "William Thompson",
      phone: "206-555-0007",
    },
  },
  {
    id: "test-afh-008",
    name: "Phuc Loc Family Home",
    city: "Federal Way",
    county: "King",
    specialty: "vietnamese",
    description: "Culturally-centered care for the Vietnamese community.",
    owner: {
      email: "test7@example.com",
      name: "Linh Nguyen",
      phone: "206-555-0008",
    },
  },
  {
    id: "test-afh-009",
    name: "Casa de Carino",
    city: "Yakima",
    county: "Yakima",
    specialty: "spanish",
    description: "Caring for our Latino community with cultural sensitivity.",
    owner: {
      email: "test8@example.com",
      name: "Maria Garcia",
      phone: "206-555-0009",
    },
  },
  {
    id: "test-afh-010",
    name: "Veterans Haven AFH",
    city: "Spokane",
    county: "Spokane",
    specialty: "veterans",
    description: "Honoring those who served with specialized veteran care.",
    owner: {
      email: "test9@example.com",
      name: "James Wilson",
      phone: "206-555-0010",
    },
  },
];

export function getFacilityConfig(id: string): FacilityConfig | undefined {
  return FACILITY_CONFIGS.find(f => f.id === id);
}

export function getAllFacilityConfigs(): FacilityConfig[] {
  return FACILITY_CONFIGS;
}
