import { db } from "./db";
import { facilities, teamMembers, credentials } from "@shared/schema";

// Image paths (can't import in seed script, use paths directly)
const caregiver1 = '/src/assets/generated_images/generic_portrait_of_a_friendly_male_caregiver.png';
const caregiver2 = '/src/assets/generated_images/generic_portrait_of_a_friendly_female_caregiver.png';
const facilityImg1 = '/src/assets/generated_images/a_friendly_welcoming_adult_family_home.png';

async function seed() {
  console.log("Starting database seed...");

  // Create facilities
  const facilityData = [
    {
      name: "Sunshine Adult Family Home",
      address: "1234 Maple Street",
      city: "Seattle",
      zipCode: "98101",
      county: "King",
      phone: "(206) 555-0123",
      email: "contact@sunshineafh.com",
      capacity: 6,
      availableBeds: 2,
      licenseNumber: "AFH-001234",
      licenseStatus: "Active",
      lastInspectionDate: "2024-09-15",
      violationsCount: 0,
      acceptsMedicaid: true,
      acceptsPrivatePay: true,
      specialties: ["Memory Care", "Dementia", "Alzheimer's"],
      amenities: ["Garden", "Private Rooms", "24/7 Care"],
      images: [facilityImg1],
      description: "Warm, family-oriented care in a beautiful setting with specialized memory care programs."
    },
    {
      name: "Peaceful Haven AFH",
      address: "5678 Oak Avenue",
      city: "Tacoma",
      zipCode: "98402",
      county: "Pierce",
      phone: "(253) 555-0456",
      email: "info@peacefulhaven.com",
      capacity: 4,
      availableBeds: 1,
      licenseNumber: "AFH-002345",
      licenseStatus: "Active",
      lastInspectionDate: "2024-10-20",
      violationsCount: 0,
      acceptsMedicaid: true,
      acceptsPrivatePay: true,
      specialties: ["Mental Health", "Behavioral Support"],
      amenities: ["Accessible", "Medication Management", "Activities"],
      images: [facilityImg1],
      description: "Specialized in mental health support with compassionate, experienced caregivers."
    },
    {
      name: "Garden View Care Home",
      address: "9012 Pine Road",
      city: "Spokane",
      zipCode: "99201",
      county: "Spokane",
      phone: "(509) 555-0789",
      email: "hello@gardenviewcare.com",
      capacity: 6,
      availableBeds: 3,
      licenseNumber: "AFH-003456",
      licenseStatus: "Active",
      lastInspectionDate: "2024-08-05",
      violationsCount: 1,
      acceptsMedicaid: false,
      acceptsPrivatePay: true,
      specialties: ["Hospice", "Palliative Care"],
      amenities: ["Garden", "Private Rooms", "Pet Friendly"],
      images: [facilityImg1],
      description: "Peaceful end-of-life care with dignity and comfort in a serene garden setting."
    },
    {
      name: "Lakeside Family Care",
      address: "3456 Lake Drive",
      city: "Bellevue",
      zipCode: "98004",
      county: "King",
      phone: "(425) 555-0234",
      email: "care@lakesidefamily.com",
      capacity: 5,
      availableBeds: 0,
      licenseNumber: "AFH-004567",
      licenseStatus: "Active",
      lastInspectionDate: "2024-11-01",
      violationsCount: 0,
      acceptsMedicaid: true,
      acceptsPrivatePay: true,
      specialties: ["Diabetes Management", "Post-Surgical Care"],
      amenities: ["Lake View", "Physical Therapy", "Nutritionist"],
      images: [facilityImg1],
      description: "Comprehensive medical support with beautiful lake views and specialized care programs."
    },
    {
      name: "Evergreen Residential Care",
      address: "7890 Forest Lane",
      city: "Olympia",
      zipCode: "98501",
      county: "Thurston",
      phone: "(360) 555-0567",
      email: "contact@evergreencare.com",
      capacity: 4,
      availableBeds: 2,
      licenseNumber: "AFH-005678",
      licenseStatus: "Active",
      lastInspectionDate: "2024-07-12",
      violationsCount: 0,
      acceptsMedicaid: true,
      acceptsPrivatePay: false,
      specialties: ["Developmental Disabilities", "Autism Support"],
      amenities: ["Sensory Room", "Outdoor Space", "Art Therapy"],
      images: [facilityImg1],
      description: "Specialized care for adults with developmental disabilities in a supportive environment."
    }
  ];

  const insertedFacilities = await db.insert(facilities).values(facilityData).returning();
  console.log(`✓ Created ${insertedFacilities.length} facilities`);

  // Create team members for first facility (Sunshine AFH)
  const sunshineAfh = insertedFacilities[0];
  
  const teamData = [
    {
      facilityId: sunshineAfh.id,
      name: "Sarah Johnson",
      email: "sarah@sunshineafh.com",
      role: "Owner / Administrator",
      status: "Active",
      isManualEntry: false,
      avatarUrl: caregiver2,
      joinedAt: new Date("2022-01-15")
    },
    {
      facilityId: sunshineAfh.id,
      name: "Michael Chen",
      email: "michael.c@email.com",
      role: "Resident Care Manager",
      status: "Active",
      isManualEntry: false,
      avatarUrl: caregiver1,
      joinedAt: new Date("2023-03-20")
    },
    {
      facilityId: sunshineAfh.id,
      name: "Jessica Davis",
      email: "jessica.d@email.com",
      role: "Caregiver (HCA)",
      status: "Invited",
      isManualEntry: false,
      avatarUrl: null,
      invitedAt: new Date("2024-11-01")
    }
  ];

  const insertedTeam = await db.insert(teamMembers).values(teamData).returning();
  console.log(`✓ Created ${insertedTeam.length} team members`);

  // Create credentials for team members
  const credentialsData = [
    // Sarah's credentials
    {
      teamMemberId: insertedTeam[0].id,
      name: "Administrator Training",
      type: "Required",
      status: "Current",
      issuedDate: "2024-05-01",
      expiryDate: "2026-05-15",
      source: "Okapi Academy",
      issuer: "Okapi Academy"
    },
    {
      teamMemberId: insertedTeam[0].id,
      name: "CPR/First Aid",
      type: "Required",
      status: "Current",
      issuedDate: "2023-11-15",
      expiryDate: "2025-11-20",
      source: "External",
      issuer: "American Red Cross"
    },
    {
      teamMemberId: insertedTeam[0].id,
      name: "Food Worker Card",
      type: "Required",
      status: "Current",
      issuedDate: "2024-01-05",
      expiryDate: "2026-01-10",
      source: "External",
      issuer: "King County Health Dept"
    },
    // Michael's credentials
    {
      teamMemberId: insertedTeam[1].id,
      name: "Mental Health Specialty",
      type: "Specialty",
      status: "Current",
      issuedDate: "2023-07-15",
      expiryDate: "2025-08-01",
      source: "Okapi Academy",
      issuer: "Okapi Academy"
    },
    {
      teamMemberId: insertedTeam[1].id,
      name: "CPR/First Aid",
      type: "Required",
      status: "Expiring Soon",
      issuedDate: "2023-04-10",
      expiryDate: "2025-04-15",
      source: "External",
      issuer: "American Red Cross"
    },
    {
      teamMemberId: insertedTeam[1].id,
      name: "Dementia Specialty",
      type: "Specialty",
      status: "Current",
      issuedDate: "2024-02-01",
      expiryDate: "2026-02-20",
      source: "Okapi Academy",
      issuer: "Okapi Academy"
    }
  ];

  const insertedCredentials = await db.insert(credentials).values(credentialsData).returning();
  console.log(`✓ Created ${insertedCredentials.length} credentials`);

  console.log("\n✅ Database seeding complete!");
  console.log(`\nSummary:`);
  console.log(`  - ${insertedFacilities.length} facilities`);
  console.log(`  - ${insertedTeam.length} team members`);
  console.log(`  - ${insertedCredentials.length} credentials`);
}

seed()
  .then(() => {
    console.log("\nSeed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });
