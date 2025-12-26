/**
 * Multi-Facility Seed Script
 * Creates 9 additional AFHs ALL OWNED BY test@example.com
 * ONE login controls 10 different facilities with facility switcher
 *
 * Login: test@example.com / test123
 */

import { db } from "../db";
import { owners, facilities, residents, teamMembers, staffAuth, facilityCapabilities } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const PASSWORD = "test123";
const OWNER_EMAIL = "test@example.com";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 9 new facilities to add to the existing owner
const NEW_FACILITIES = [
  { name: "Harmony House AFH", city: "Tacoma", county: "Pierce", specialty: "Mental Health" },
  { name: "Golden Years Care Home", city: "Bellevue", county: "King", specialty: "Developmental Disabilities" },
  { name: "Evergreen Adult Family Home", city: "Everett", county: "Snohomish", specialty: "General Care" },
  { name: "Comfort Care AFH", city: "Kent", county: "King", specialty: "Hospice" },
  { name: "Peaceful Pines Home", city: "Renton", county: "King", specialty: "Budget-Friendly" },
  { name: "Loving Hearts AFH", city: "Kirkland", county: "King", specialty: "Premium Care" },
  { name: "Mountain View Care Home", city: "Federal Way", county: "King", specialty: "Vietnamese Focus" },
  { name: "Serenity Adult Family Home", city: "Spokane", county: "Spokane", specialty: "Spanish Speaking" },
  { name: "Caring Hands AFH", city: "Bellingham", county: "Whatcom", specialty: "Veterans" },
];

const FIRST_NAMES = ["Maria", "James", "Linda", "Robert", "Patricia", "Michael", "Barbara", "William", "Elizabeth", "David", "Jennifer", "Richard", "Susan", "Joseph", "Margaret"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const DIAGNOSES = ["Alzheimer's Disease", "Dementia", "Type 2 Diabetes", "Hypertension", "COPD", "Parkinson's Disease", "Depression", "Anxiety"];
const ALLERGIES = ["Penicillin", "Sulfa", "Aspirin", "None known"];

async function seedMultiFacility() {
  console.log("═".repeat(60));
  console.log("🏠 MULTI-FACILITY SEED SCRIPT");
  console.log("═".repeat(60));
  console.log("\nCreating 9 additional facilities for test@example.com...\n");

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  // 1. Find or create the test@example.com owner
  let owner = await db.query.owners.findFirst({
    where: eq(owners.email, OWNER_EMAIL),
  });

  if (!owner) {
    console.log("⚠️  Owner test@example.com not found. Creating...");
    const [newOwner] = await db.insert(owners).values({
      email: OWNER_EMAIL,
      passwordHash: hashedPassword,
      name: "Test Owner",
      phone: "206-555-0100",
      status: "active",
      emailVerified: true,
    }).returning();
    owner = newOwner;
    console.log("✅ Created owner: test@example.com\n");
  } else {
    console.log(`✅ Found existing owner: ${owner.email} (ID: ${owner.id})\n`);
  }

  // 2. Get existing facilities for this owner
  const existingFacilities = await db.query.facilities.findMany({
    where: eq(facilities.ownerId, owner.id),
  });
  console.log(`📊 Owner currently has ${existingFacilities.length} facility(ies)\n`);

  // 3. Create 9 new facilities for this owner
  for (let i = 0; i < NEW_FACILITIES.length; i++) {
    const config = NEW_FACILITIES[i];
    const facilityNumber = existingFacilities.length + i + 1;

    console.log(`\n📍 Facility #${facilityNumber}: ${config.name}`);
    console.log(`   Location: ${config.city}, WA (${config.county} County)`);
    console.log(`   Specialty: ${config.specialty}`);

    // Check if facility with this name already exists for this owner
    const existingFacility = existingFacilities.find(f => f.name === config.name);
    if (existingFacility) {
      console.log(`   ⚠️  Already exists, skipping...`);
      continue;
    }

    // Also check by slug
    const slug = slugify(config.name) + '-' + randomBetween(100, 999);
    const bedCount = randomBetween(4, 6);

    // Create facility
    const [facility] = await db.insert(facilities).values({
      ownerId: owner.id,
      name: config.name,
      slug,
      facilityType: 'afh',
      address: `${randomBetween(1000, 9999)} Main Street`,
      city: config.city,
      state: "WA",
      zipCode: `98${String(100 + i + 1).padStart(3, '0')}`,
      county: config.county,
      phone: `206-555-${String(2000 + i + 1).padStart(4, '0')}`,
      email: `contact@${slugify(config.name)}.com`,
      capacity: bedCount,
      availableBeds: bedCount,
      licenseNumber: `AFH-${String(300000 + (i + 1) * 1111)}`,
      licenseStatus: 'Active',
      acceptsMedicaid: i !== 5, // Premium care doesn't accept Medicaid
      acceptsPrivatePay: true,
      specialties: [config.specialty, "Elderly Care"],
      amenities: ["Home-cooked meals", "24/7 care", "Private rooms"],
      description: `${config.name} is a licensed Adult Family Home in ${config.city}, WA specializing in ${config.specialty.toLowerCase()}. We provide personalized care in a warm, home-like environment.`,
      status: 'active',
      claimStatus: 'claimed',
      claimedAt: new Date(),
      featured: i < 2,
      priceMin: 4000 + (i * 500),
      priceMax: 6000 + (i * 500),
    }).returning();

    console.log(`   ✅ Created facility (${bedCount} beds)`);

    // 4. Create residents for this facility
    const numResidents = randomBetween(2, Math.min(4, bedCount));
    for (let r = 0; r < numResidents; r++) {
      const resFirst = FIRST_NAMES[(i + r + 5) % FIRST_NAMES.length];
      const resLast = LAST_NAMES[(i + r + 3) % LAST_NAMES.length];
      const age = randomBetween(70, 92);
      const birthYear = new Date().getFullYear() - age;

      await db.insert(residents).values({
        facilityId: facility.id,
        firstName: resFirst,
        lastName: resLast,
        preferredName: r % 3 === 0 ? resFirst.slice(0, -1) + "y" : null,
        dateOfBirth: new Date(birthYear, randomBetween(0, 11), randomBetween(1, 28)).toISOString().split('T')[0],
        roomNumber: String(r + 1),
        admissionDate: new Date(2024 - randomBetween(0, 2), randomBetween(0, 11), randomBetween(1, 28)).toISOString().split('T')[0],
        status: "active",
        diagnoses: [DIAGNOSES[randomBetween(0, DIAGNOSES.length - 1)], DIAGNOSES[randomBetween(0, DIAGNOSES.length - 1)]],
        allergies: [ALLERGIES[randomBetween(0, ALLERGIES.length - 1)]],
        codeStatus: r % 3 === 0 ? "dnr" : "full_code",
        emergencyContacts: [{
          name: `${FIRST_NAMES[(i + r + 7) % FIRST_NAMES.length]} ${resLast}`,
          phone: `206-555-${String(randomBetween(3000, 3999))}`,
          relationship: r % 2 === 0 ? "Son" : "Daughter",
          isPrimary: true,
        }],
      });
    }
    console.log(`   ✅ Created ${numResidents} residents`);

    // Update available beds
    await db.update(facilities)
      .set({ availableBeds: bedCount - numResidents })
      .where(eq(facilities.id, facility.id));

    // 5. Create staff for this facility
    const numStaff = randomBetween(2, 4);
    const roles = ["Lead Caregiver", "Caregiver", "CNA", "HCA"];

    for (let s = 0; s < numStaff; s++) {
      const staffFirst = FIRST_NAMES[(i + s + 8) % FIRST_NAMES.length];
      const staffLast = LAST_NAMES[(i + s + 6) % LAST_NAMES.length];
      const staffName = `${staffFirst} ${staffLast}`;
      const staffEmail = `${staffFirst.toLowerCase()}.${staffLast.toLowerCase()}.f${facilityNumber}@carestaff.com`;
      const role = roles[s % roles.length];

      // Create team member
      const [teamMember] = await db.insert(teamMembers).values({
        facilityId: facility.id,
        name: staffName,
        email: staffEmail,
        phone: `206-555-${String(randomBetween(4000, 4999))}`,
        role,
        hireDate: new Date(2023 - (s % 2), randomBetween(0, 11), randomBetween(1, 28)).toISOString().split('T')[0],
        status: "Active",
        isManualEntry: true,
      }).returning();

      // Create staff auth for login
      await db.insert(staffAuth).values({
        facilityId: facility.id,
        teamMemberId: teamMember.id,
        email: staffEmail,
        passwordHash: hashedPassword,
        firstName: staffFirst,
        lastName: staffLast,
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
    }
    console.log(`   ✅ Created ${numStaff} staff members`);

    // 6. Create facility capabilities
    try {
      await db.insert(facilityCapabilities).values({
        facilityId: facility.id,
        careTypes: { afh: true, assistedLiving: false, skilledNursing: false, hospice: i === 3, respiteCare: i % 3 === 0, adultDaycare: false },
        specializations: {
          dementia: i === 0 || i === 5,
          alzheimers: i === 0,
          mentalHealth: i === 0,
          developmentalDisabilities: i === 1,
          parkinsons: false,
          diabetes: true,
          hospicePalliative: i === 3,
          traumaticBrainInjury: false,
          dialysis: false,
          postSurgeryRehab: false,
          bariatric: false,
          youngAdults: i === 1,
          veterans: i === 8,
        },
        medicalServices: {
          nursingCare24hr: false,
          rnOnSite: i === 5,
          lpnOnSite: false,
          medicationManagement: true,
          medicationAdministration: true,
          injections: i % 2 === 0,
          woundCare: i === 3,
          catheterCare: false,
          ostomyCare: false,
          oxygenTherapy: i === 3,
          cpapBipap: false,
          feedingTube: false,
          physicalTherapy: i === 5,
          occupationalTherapy: false,
          speechTherapy: false,
          bloodGlucoseMonitoring: true,
          vitalSignsMonitoring: true,
          hospiceCoordination: i === 3,
        },
        paymentAccepted: {
          privatePay: true,
          medicaidCOPES: i !== 5,
          medicaidWaiver: i === 1,
          medicare: i === 3 || i === 8,
          longTermCareInsurance: true,
          vaAidAttendance: i === 8,
          vaCommunityLiving: i === 8,
          slidingScale: i === 4,
          financialAssistance: i === 4,
        },
        pricing: {
          baseRateMin: 4000 + (i * 500),
          baseRateMax: 6000 + (i * 500),
          medicaidRate: i !== 5 ? 3500 + (i * 200) : null,
          additionalCareRates: { level1: 500, level2: 1000, level3: 1500 },
          includesInPricing: ['Room', 'Board', 'Personal Care'],
          additionalFees: [],
        },
        amenities: {
          privateRooms: true,
          sharedRooms: i !== 5,
          privateBathroom: i === 5,
          wheelchairAccessible: true,
          hospitalBeds: i >= 3,
          hoyerLift: i >= 3,
          walkInShower: true,
          emergencyCallSystem: true,
          securedMemoryCare: i === 0,
          wanderPrevention: i === 0,
          outdoorSpace: true,
          garden: i % 2 === 0,
          petFriendly: i !== 3,
          petsOnSite: i === 5,
          smokingAllowed: false,
          wifi: true,
          cableTV: true,
          airConditioning: true,
          homeCookedMeals: true,
          specialDiets: true,
          activities: true,
          transportation: i !== 3,
          laundry: true,
          housekeeping: true,
        },
        culturalServices: i === 6
          ? { languagesSpoken: ['English', 'Vietnamese'], culturalFoods: ['Vietnamese', 'Asian'], religiousServices: true, religiousAffiliation: 'Buddhist', lgbtqFriendly: true, culturalActivities: ['Vietnamese Cultural Activities'] }
          : i === 7
            ? { languagesSpoken: ['English', 'Spanish'], culturalFoods: ['Mexican', 'Latin American'], religiousServices: true, religiousAffiliation: 'Catholic', lgbtqFriendly: true, culturalActivities: ['Hispanic Cultural Activities'] }
            : { languagesSpoken: ['English'], culturalFoods: [], religiousServices: false, religiousAffiliation: null, lgbtqFriendly: true, culturalActivities: [] },
        availability: {
          totalBeds: bedCount,
          currentOccupancy: numResidents,
          availableBeds: bedCount - numResidents,
          waitlistLength: 0,
          acceptingNewResidents: true,
          respiteCareAvailable: i % 3 === 0,
        },
      });
      console.log(`   ✅ Created capabilities profile`);
    } catch (e) {
      console.log(`   ⚠️  Capabilities: ${e instanceof Error ? e.message : 'error'}`);
    }
  }

  // Final summary
  const finalFacilities = await db.query.facilities.findMany({
    where: eq(facilities.ownerId, owner.id),
  });

  console.log("\n\n" + "═".repeat(60));
  console.log("✨ MULTI-FACILITY SEED COMPLETED!");
  console.log("═".repeat(60));
  console.log(`\n🔐 LOGIN: test@example.com / test123`);
  console.log(`\n📊 Owner now has ${finalFacilities.length} facilities:\n`);

  finalFacilities.forEach((f, idx) => {
    console.log(`   ${idx + 1}. ${f.name} (${f.city}, WA)`);
  });

  console.log("\n💡 Use the facility switcher in the dashboard to switch between facilities");
  console.log("═".repeat(60) + "\n");
}

seedMultiFacility()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  });
