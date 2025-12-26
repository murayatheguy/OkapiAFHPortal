/**
 * Clean Test Data Script
 *
 * Safely removes ONLY test data from the database.
 * Real customer data is never touched.
 *
 * Usage:
 *   npm run seed:clean
 *   npm run seed:clean -- --force (skip confirmation)
 */

import { db } from "../db";
import { owners, facilities, residents, teamMembers, staffAuth, facilityCapabilities } from "../../shared/schema";
import { eq, like, or, inArray } from "drizzle-orm";
import { SEED_CONFIG, checkEnvironmentSafety, isTestData } from "./config";
import { FACILITY_CONFIGS } from "./facilities";
import * as readline from "readline";

// ============ TYPES ============

interface CleanupTargets {
  facilities: { id: string; name: string }[];
  residents: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  owners: { id: string; email: string }[];
}

// ============ FIND TEST DATA ============

async function findTestData(): Promise<CleanupTargets> {
  const targets: CleanupTargets = {
    facilities: [],
    residents: [],
    staff: [],
    owners: [],
  };

  // Find test facilities by license number prefix or description marker
  const allFacilities = await db.query.facilities.findMany();

  for (const f of allFacilities) {
    if (isTestData({
      licenseNumber: f.licenseNumber,
      description: f.description,
    })) {
      targets.facilities.push({ id: f.id, name: f.name });

      // Find residents in this facility
      const facilityResidents = await db.query.residents.findMany({
        where: eq(residents.facilityId, f.id),
      });

      for (const r of facilityResidents) {
        targets.residents.push({
          id: r.id,
          name: `${r.firstName} ${r.lastName}`,
        });
      }

      // Find team members in this facility
      const facilityStaff = await db.query.teamMembers.findMany({
        where: eq(teamMembers.facilityId, f.id),
      });

      for (const s of facilityStaff) {
        targets.staff.push({
          id: s.id,
          name: s.name,
        });
      }
    }
  }

  // Find test owners by email domain
  const testEmails = FACILITY_CONFIGS.map(c => c.owner.email);

  for (const email of testEmails) {
    const owner = await db.query.owners.findFirst({
      where: eq(owners.email, email),
    });
    if (owner) {
      targets.owners.push({ id: owner.id, email: owner.email });
    }
  }

  return targets;
}

// ============ DELETE TEST DATA ============

async function deleteTestData(targets: CleanupTargets): Promise<void> {
  console.log("\n🗑️  Deleting test data...\n");

  // Delete in correct order (respect foreign keys)

  // 1. Delete residents first
  if (targets.residents.length > 0) {
    const residentIds = targets.residents.map(r => r.id);
    await db.delete(residents).where(inArray(residents.id, residentIds));
    console.log(`   ✅ Deleted ${targets.residents.length} residents`);
  }

  // 2. Delete staff auth (before team members due to FK)
  if (targets.staff.length > 0) {
    const staffIds = targets.staff.map(s => s.id);
    await db.delete(staffAuth).where(inArray(staffAuth.teamMemberId, staffIds));
    console.log(`   ✅ Deleted staff auth records`);
  }

  // 3. Delete team members
  if (targets.staff.length > 0) {
    const staffIds = targets.staff.map(s => s.id);
    await db.delete(teamMembers).where(inArray(teamMembers.id, staffIds));
    console.log(`   ✅ Deleted ${targets.staff.length} team members`);
  }

  // 4. Delete facility capabilities
  if (targets.facilities.length > 0) {
    const facilityIds = targets.facilities.map(f => f.id);
    await db.delete(facilityCapabilities).where(inArray(facilityCapabilities.facilityId, facilityIds));
    console.log(`   ✅ Deleted facility capabilities`);
  }

  // 5. Delete facilities
  if (targets.facilities.length > 0) {
    const facilityIds = targets.facilities.map(f => f.id);
    await db.delete(facilities).where(inArray(facilities.id, facilityIds));
    console.log(`   ✅ Deleted ${targets.facilities.length} facilities`);
  }

  // 6. Delete owners (only if they have no other facilities)
  for (const o of targets.owners) {
    const remainingFacilities = await db.query.facilities.findMany({
      where: eq(facilities.ownerId, o.id),
    });

    if (remainingFacilities.length === 0) {
      await db.delete(owners).where(eq(owners.id, o.id));
      console.log(`   ✅ Deleted owner: ${o.email}`);
    } else {
      console.log(`   ⏭️  Kept owner ${o.email} (has ${remainingFacilities.length} other facilities)`);
    }
  }
}

// ============ CONFIRMATION PROMPT ============

async function confirm(message: string): Promise<boolean> {
  // Check for --force flag
  if (process.argv.includes("--force")) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toUpperCase() === "DELETE");
    });
  });
}

// ============ MAIN ============

async function clean(): Promise<void> {
  // Safety check
  const safetyCheck = checkEnvironmentSafety();
  if (!safetyCheck.safe) {
    console.error(safetyCheck.reason);
    process.exit(1);
  }

  console.log("\n" + "═".repeat(60));
  console.log("🧹 CLEAN TEST DATA");
  console.log("═".repeat(60));
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("═".repeat(60));

  // Find test data
  console.log("\n🔍 Scanning for test data...\n");
  const targets = await findTestData();

  // Display what will be deleted
  console.log("─".repeat(60));
  console.log("📋 TEST DATA FOUND:");
  console.log("─".repeat(60));

  console.log(`\n   Facilities (${targets.facilities.length}):`);
  if (targets.facilities.length === 0) {
    console.log("      (none)");
  } else {
    targets.facilities.forEach(f => console.log(`      • ${f.name}`));
  }

  console.log(`\n   Residents (${targets.residents.length}):`);
  if (targets.residents.length === 0) {
    console.log("      (none)");
  } else if (targets.residents.length <= 10) {
    targets.residents.forEach(r => console.log(`      • ${r.name}`));
  } else {
    targets.residents.slice(0, 5).forEach(r => console.log(`      • ${r.name}`));
    console.log(`      ... and ${targets.residents.length - 5} more`);
  }

  console.log(`\n   Staff (${targets.staff.length}):`);
  if (targets.staff.length === 0) {
    console.log("      (none)");
  } else if (targets.staff.length <= 10) {
    targets.staff.forEach(s => console.log(`      • ${s.name}`));
  } else {
    targets.staff.slice(0, 5).forEach(s => console.log(`      • ${s.name}`));
    console.log(`      ... and ${targets.staff.length - 5} more`);
  }

  console.log(`\n   Owners (${targets.owners.length}):`);
  if (targets.owners.length === 0) {
    console.log("      (none)");
  } else {
    targets.owners.forEach(o => console.log(`      • ${o.email}`));
  }

  console.log("\n" + "─".repeat(60));

  // Check if there's anything to delete
  const totalItems = targets.facilities.length + targets.residents.length +
                     targets.staff.length + targets.owners.length;

  if (totalItems === 0) {
    console.log("\n✅ No test data found. Database is clean.\n");
    return;
  }

  // Confirm deletion
  console.log("\n⚠️  WARNING: This action cannot be undone!\n");
  const confirmed = await confirm('Type "DELETE" to confirm deletion: ');

  if (!confirmed) {
    console.log("\n❌ Cancelled. No data was deleted.\n");
    return;
  }

  // Delete
  await deleteTestData(targets);

  console.log("\n" + "═".repeat(60));
  console.log("✨ Test data cleaned successfully!");
  console.log("═".repeat(60));
  console.log("\nRun 'npm run seed:new' to recreate test data.\n");
}

// ============ RUN ============

clean()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Clean error:", error);
    process.exit(1);
  });
