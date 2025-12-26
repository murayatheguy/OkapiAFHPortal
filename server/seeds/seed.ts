/**
 * Main Seed Script
 *
 * Creates test Adult Family Homes with owners, residents, and staff.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   npm run seed:new
 */

import { db } from "../db";
import { owners, facilities, residents, teamMembers, staffAuth, facilityCapabilities } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

import { SEED_CONFIG, checkEnvironmentSafety, generateTestLicenseNumber } from "./config";
import { AFH_TEMPLATE, getSpecialtyPricing, getResidentAgeRange } from "./template";
import { FACILITY_CONFIGS, type FacilityConfig } from "./facilities";
import {
  hashPassword,
  generateUniqueName,
  generatePhone,
  generateAddress,
  generateElderlyBirthDate,
  generatePastDateStr,
  randomFrom,
  randomBetween,
  slugify,
  log,
} from "./utils";

// ============ TYPES ============

interface SeedResult {
  success: boolean;
  created: {
    owners: number;
    facilities: number;
    residents: number;
    staff: number;
  };
  skipped: {
    owners: number;
    facilities: number;
  };
  errors: string[];
}

// ============ MAIN SEED FUNCTION ============

async function seed(): Promise<SeedResult> {
  const result: SeedResult = {
    success: true,
    created: { owners: 0, facilities: 0, residents: 0, staff: 0 },
    skipped: { owners: 0, facilities: 0 },
    errors: [],
  };

  // Safety check
  const safetyCheck = checkEnvironmentSafety();
  if (!safetyCheck.safe) {
    console.error(safetyCheck.reason);
    process.exit(1);
  }

  console.log("\n" + "═".repeat(60));
  console.log("🌱 AFH SEED SCRIPT v" + AFH_TEMPLATE.version);
  console.log("═".repeat(60));
  console.log(`Facilities to Create: ${FACILITY_CONFIGS.length}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("═".repeat(60));

  // Hash the test password once
  const hashedPassword = await hashPassword(SEED_CONFIG.testPassword);

  // Track used names to avoid duplicates
  const usedResidentNames = new Set<string>();
  const usedStaffNames = new Set<string>();

  // Process each facility config
  for (let i = 0; i < FACILITY_CONFIGS.length; i++) {
    const config = FACILITY_CONFIGS[i];

    try {
      await seedFacility(config, i, hashedPassword, usedResidentNames, usedStaffNames, result);
    } catch (error) {
      const errorMsg = `Failed to seed ${config.name}: ${error instanceof Error ? error.message : String(error)}`;
      log.error(errorMsg);
      result.errors.push(errorMsg);
      result.success = false;
    }
  }

  // Print summary
  printSummary(result);

  return result;
}

// ============ SEED SINGLE FACILITY ============

async function seedFacility(
  config: FacilityConfig,
  index: number,
  hashedPassword: string,
  usedResidentNames: Set<string>,
  usedStaffNames: Set<string>,
  result: SeedResult
): Promise<void> {
  log.header(`${config.name} (${config.city}, WA)`);
  console.log(`   Specialty: ${config.specialty || "General"}`);
  console.log(`   Owner: ${config.owner.email}`);

  // 1. Create or find owner
  let owner = await db.query.owners.findFirst({
    where: eq(owners.email, config.owner.email),
  });

  if (owner) {
    log.skip(`Owner exists (ID: ${owner.id})`);
    result.skipped.owners++;
  } else {
    const [newOwner] = await db.insert(owners).values({
      email: config.owner.email,
      passwordHash: hashedPassword,
      name: config.owner.name,
      phone: config.owner.phone || generatePhone(),
      status: "active",
      emailVerified: true,
    }).returning();

    owner = newOwner;
    log.success(`Created owner: ${config.owner.name}`);
    result.created.owners++;
  }

  // 2. Create or find facility
  let facility = await db.query.facilities.findFirst({
    where: and(
      eq(facilities.ownerId, owner.id),
      eq(facilities.name, config.name)
    ),
  });

  if (facility) {
    log.skip(`Facility exists (ID: ${facility.id})`);
    result.skipped.facilities++;
  } else {
    const bedCount = config.overrides?.bedCount ||
      randomBetween(AFH_TEMPLATE.facility.bedCount.min, AFH_TEMPLATE.facility.bedCount.max);

    const pricing = getSpecialtyPricing(config.specialty);
    const facilitySlug = slugify(config.name) + '-' + randomBetween(100, 999);

    const [newFacility] = await db.insert(facilities).values({
      ownerId: owner.id,
      name: config.name,
      slug: facilitySlug,
      facilityType: AFH_TEMPLATE.facility.type,
      address: generateAddress(),
      city: config.city,
      state: AFH_TEMPLATE.facility.state,
      zipCode: `98${String(100 + index).padStart(3, "0")}`,
      county: config.county,
      phone: generatePhone(),
      email: `contact@${slugify(config.name)}.com`,
      capacity: bedCount,
      availableBeds: bedCount,
      licenseNumber: generateTestLicenseNumber(index),
      licenseStatus: "Active",
      acceptsMedicaid: config.specialty !== "premium",
      acceptsPrivatePay: true,
      specialties: config.specialty ? [config.specialty] : ["General Care"],
      amenities: ["Home-cooked meals", "24/7 care", "Private rooms"],
      description: `${config.description || ""} ${SEED_CONFIG.testDataMarker.descriptionMarker}`.trim(),
      status: AFH_TEMPLATE.facility.status,
      claimStatus: AFH_TEMPLATE.facility.claimStatus,
      claimedAt: new Date(),
      featured: index < 2,
      priceMin: pricing.min,
      priceMax: pricing.max,
    }).returning();

    facility = newFacility;
    log.success(`Created facility (ID: ${facility.id}, ${bedCount} beds)`);
    result.created.facilities++;
  }

  // 3. Create residents
  const existingResidents = await db.query.residents.findMany({
    where: eq(residents.facilityId, facility.id),
  });

  const targetResidentCount = config.overrides?.residentCount ??
    randomBetween(AFH_TEMPLATE.residents.count.min, Math.min(AFH_TEMPLATE.residents.count.max, facility.capacity - 1));

  const residentsToCreate = Math.max(0, targetResidentCount - existingResidents.length);

  if (residentsToCreate > 0) {
    const ageRange = getResidentAgeRange(config.specialty);

    for (let r = 0; r < residentsToCreate; r++) {
      const { first, last } = generateUniqueName(usedResidentNames);
      const roomNumber = String(existingResidents.length + r + 1);

      await db.insert(residents).values({
        facilityId: facility.id,
        firstName: first,
        lastName: last,
        preferredName: Math.random() > 0.7 ? first.slice(0, -1) + "y" : null,
        dateOfBirth: generateElderlyBirthDate(ageRange.min, ageRange.max),
        roomNumber,
        admissionDate: generatePastDateStr(3),
        status: "active",
        diagnoses: randomFrom(AFH_TEMPLATE.residents.diagnoses),
        allergies: [randomFrom(AFH_TEMPLATE.residents.allergies.filter(a => a !== null)) || "None known"],
        codeStatus: randomFrom(AFH_TEMPLATE.residents.codeStatuses),
        emergencyContacts: [{
          name: `${randomFrom(["John", "Jane", "Robert", "Mary"])} ${last}`,
          phone: generatePhone(),
          relationship: randomFrom(AFH_TEMPLATE.residents.relationships),
          isPrimary: true,
        }],
      });
    }

    // Update available beds
    await db.update(facilities)
      .set({ availableBeds: facility.capacity - (existingResidents.length + residentsToCreate) })
      .where(eq(facilities.id, facility.id));

    log.success(`Created ${residentsToCreate} residents (total: ${existingResidents.length + residentsToCreate})`);
    result.created.residents += residentsToCreate;
  } else {
    log.skip(`Residents exist (${existingResidents.length})`);
  }

  // 4. Create staff (teamMembers + staffAuth)
  const existingStaff = await db.query.teamMembers.findMany({
    where: eq(teamMembers.facilityId, facility.id),
  });

  const targetStaffCount = config.overrides?.staffCount ??
    randomBetween(AFH_TEMPLATE.staff.count.min, AFH_TEMPLATE.staff.count.max);

  const staffToCreate = Math.max(0, targetStaffCount - existingStaff.length);

  if (staffToCreate > 0) {
    for (let s = 0; s < staffToCreate; s++) {
      const { first, last } = generateUniqueName(usedStaffNames);
      const role = s === 0 ? AFH_TEMPLATE.staff.roles[0] : randomFrom(AFH_TEMPLATE.staff.roles);
      const staffEmail = `${first.toLowerCase()}.${last.toLowerCase()}.${facility.id.slice(0, 8)}@carestaff.${SEED_CONFIG.testDataMarker.emailDomain}`;

      // Create team member
      const [teamMember] = await db.insert(teamMembers).values({
        facilityId: facility.id,
        name: `${first} ${last}`,
        email: staffEmail,
        phone: generatePhone(),
        role,
        hireDate: generatePastDateStr(AFH_TEMPLATE.staff.employmentYears.max),
        status: "Active",
        isManualEntry: true,
      }).returning();

      // Create staff auth for login
      await db.insert(staffAuth).values({
        facilityId: facility.id,
        teamMemberId: teamMember.id,
        email: staffEmail,
        passwordHash: hashedPassword,
        firstName: first,
        lastName: last,
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

    log.success(`Created ${staffToCreate} staff (total: ${existingStaff.length + staffToCreate})`);
    result.created.staff += staffToCreate;
  } else {
    log.skip(`Staff exist (${existingStaff.length})`);
  }

  // 5. Create facility capabilities (for care matching)
  try {
    const existingCaps = await db.query.facilityCapabilities.findFirst({
      where: eq(facilityCapabilities.facilityId, facility.id),
    });

    if (!existingCaps) {
      const pricing = getSpecialtyPricing(config.specialty);

      await db.insert(facilityCapabilities).values({
        facilityId: facility.id,
        careTypes: {
          afh: true,
          assistedLiving: false,
          skilledNursing: false,
          hospice: config.specialty === "hospice",
          respiteCare: index % 3 === 0,
          adultDaycare: false,
        },
        specializations: {
          dementia: config.specialty === "dementia",
          alzheimers: config.specialty === "dementia",
          mentalHealth: config.specialty === "mentalHealth",
          developmentalDisabilities: config.specialty === "developmentalDisabilities",
          parkinsons: false,
          diabetes: true,
          hospicePalliative: config.specialty === "hospice",
          traumaticBrainInjury: false,
          dialysis: false,
          postSurgeryRehab: false,
          bariatric: false,
          youngAdults: config.specialty === "developmentalDisabilities",
          veterans: config.specialty === "veterans",
        },
        medicalServices: {
          nursingCare24hr: false,
          rnOnSite: config.specialty === "premium",
          lpnOnSite: false,
          medicationManagement: true,
          medicationAdministration: true,
          injections: config.specialty === "hospice" || config.specialty === "mentalHealth",
          woundCare: config.specialty === "hospice",
          catheterCare: false,
          ostomyCare: false,
          oxygenTherapy: config.specialty === "hospice",
          cpapBipap: false,
          feedingTube: false,
          physicalTherapy: config.specialty === "premium",
          occupationalTherapy: false,
          speechTherapy: false,
          bloodGlucoseMonitoring: true,
          vitalSignsMonitoring: true,
          hospiceCoordination: config.specialty === "hospice",
        },
        paymentAccepted: {
          privatePay: true,
          medicaidCOPES: config.specialty !== "premium",
          medicaidWaiver: config.specialty === "developmentalDisabilities",
          medicare: config.specialty === "hospice" || config.specialty === "veterans",
          longTermCareInsurance: true,
          vaAidAttendance: config.specialty === "veterans",
          vaCommunityLiving: config.specialty === "veterans",
          slidingScale: config.specialty === "budget",
          financialAssistance: config.specialty === "budget",
        },
        pricing: {
          baseRateMin: pricing.min,
          baseRateMax: pricing.max,
          medicaidRate: config.specialty !== "premium" ? 3500 : null,
          additionalCareRates: { level1: 500, level2: 1000, level3: 1500 },
          includesInPricing: ["Room", "Board", "Personal Care"],
          additionalFees: [],
        },
        amenities: {
          privateRooms: true,
          sharedRooms: config.specialty !== "premium",
          privateBathroom: config.specialty === "premium",
          wheelchairAccessible: true,
          hospitalBeds: config.specialty === "hospice",
          hoyerLift: config.specialty === "hospice",
          walkInShower: true,
          emergencyCallSystem: true,
          securedMemoryCare: config.specialty === "dementia",
          wanderPrevention: config.specialty === "dementia",
          outdoorSpace: true,
          garden: index % 2 === 0,
          petFriendly: config.specialty !== "hospice",
          petsOnSite: config.specialty === "premium",
          smokingAllowed: false,
          wifi: true,
          cableTV: true,
          airConditioning: true,
          homeCookedMeals: true,
          specialDiets: true,
          activities: true,
          transportation: config.specialty !== "hospice",
          laundry: true,
          housekeeping: true,
        },
        culturalServices: config.specialty === "vietnamese"
          ? { languagesSpoken: ["English", "Vietnamese"], culturalFoods: ["Vietnamese", "Asian"], religiousServices: true, religiousAffiliation: "Buddhist", lgbtqFriendly: true, culturalActivities: ["Vietnamese Cultural Activities"] }
          : config.specialty === "spanish"
            ? { languagesSpoken: ["English", "Spanish"], culturalFoods: ["Mexican", "Latin American"], religiousServices: true, religiousAffiliation: "Catholic", lgbtqFriendly: true, culturalActivities: ["Hispanic Cultural Activities"] }
            : { languagesSpoken: ["English"], culturalFoods: [], religiousServices: false, religiousAffiliation: null, lgbtqFriendly: true, culturalActivities: [] },
        availability: {
          totalBeds: facility.capacity,
          currentOccupancy: existingResidents.length + residentsToCreate,
          availableBeds: facility.capacity - (existingResidents.length + residentsToCreate),
          waitlistLength: 0,
          acceptingNewResidents: true,
          respiteCareAvailable: index % 3 === 0,
        },
      });
      log.success(`Created capabilities profile`);
    }
  } catch (e) {
    log.warn(`Capabilities: ${e instanceof Error ? e.message : "error"}`);
  }
}

// ============ PRINT SUMMARY ============

function printSummary(result: SeedResult): void {
  console.log("\n" + "═".repeat(60));
  console.log("📊 SEED SUMMARY");
  console.log("═".repeat(60));

  console.log("\n✅ Created:");
  console.log(`   Owners:     ${result.created.owners}`);
  console.log(`   Facilities: ${result.created.facilities}`);
  console.log(`   Residents:  ${result.created.residents}`);
  console.log(`   Staff:      ${result.created.staff}`);

  console.log("\n⏭️  Skipped (already exist):");
  console.log(`   Owners:     ${result.skipped.owners}`);
  console.log(`   Facilities: ${result.skipped.facilities}`);

  if (result.errors.length > 0) {
    console.log("\n❌ Errors:");
    result.errors.forEach(e => console.log(`   ${e}`));
  }

  console.log("\n" + "─".repeat(60));
  console.log("🔐 LOGIN CREDENTIALS");
  console.log("─".repeat(60));
  console.log(`   Password for all accounts: ${SEED_CONFIG.testPassword}`);
  console.log("");
  FACILITY_CONFIGS.forEach((config, i) => {
    console.log(`   ${(i + 1).toString().padStart(2)}. ${config.owner.email.padEnd(25)} → ${config.name}`);
  });
  console.log("─".repeat(60));

  console.log(`\n${result.success ? "✨" : "⚠️"} Seed ${result.success ? "completed successfully" : "completed with errors"}!\n`);
}

// ============ RUN ============

seed()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Fatal seed error:", error);
    process.exit(1);
  });
