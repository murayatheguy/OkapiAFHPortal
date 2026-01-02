/**
 * Seed Script: Admin & Facility Defaults
 *
 * Creates:
 * 1. A super_admin account
 * 2. Initial facility defaults for template propagation
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *
 * Environment:
 *   ADMIN_PASSWORD - Password for the admin account (defaults to 'OkapiAdmin2024!')
 *   DATABASE_URL - Neon PostgreSQL connection string
 */

import "dotenv/config";
import { db } from "../server/db";
import { admins, listingDefaults } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@okapicarenetwork.com";
const ADMIN_NAME = "Super Admin";
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "OkapiAdmin2024!";

async function seedAdmin() {
  console.log("🔐 Seeding admin account...");

  // Check if admin already exists
  const existing = await db.query.admins.findFirst({
    where: eq(admins.email, ADMIN_EMAIL),
  });

  if (existing) {
    console.log(`   ✓ Admin ${ADMIN_EMAIL} already exists (id: ${existing.id})`);
    return existing;
  }

  // Create admin with hashed password
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const [newAdmin] = await db
    .insert(admins)
    .values({
      email: ADMIN_EMAIL,
      passwordHash,
      name: ADMIN_NAME,
      role: "super_admin",
      canImpersonate: true,
    })
    .returning();

  console.log(`   ✓ Created super_admin: ${ADMIN_EMAIL}`);
  console.log(`   ✓ Password: ${DEFAULT_PASSWORD}`);
  console.log(`   ✓ ID: ${newAdmin.id}`);

  return newAdmin;
}

async function seedListingDefaults() {
  console.log("\n📋 Seeding listing defaults (applied at render time)...");

  const defaults = [
    {
      fieldName: "acceptsMedicaid",
      defaultValue: false,
      description: "Whether facility accepts Medicaid by default",
    },
    {
      fieldName: "acceptsPrivatePay",
      defaultValue: true,
      description: "Whether facility accepts private pay by default",
    },
    {
      fieldName: "amenities",
      defaultValue: [
        "24/7 Care",
        "Medication Management",
        "Meals Provided",
        "Housekeeping",
        "Laundry Service",
      ],
      description: "Default amenities for new facilities",
    },
    {
      fieldName: "careTypes",
      defaultValue: [
        "Personal Care",
        "Memory Care",
        "Respite Care",
      ],
      description: "Default care types offered",
    },
    {
      fieldName: "specialties",
      defaultValue: [
        "Dementia Care",
        "Alzheimer's Care",
        "Mobility Assistance",
      ],
      description: "Default specialties",
    },
    {
      fieldName: "acceptingInquiries",
      defaultValue: "accepting",
      description: "Default inquiry acceptance status",
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const def of defaults) {
    const existing = await db.query.listingDefaults.findFirst({
      where: eq(listingDefaults.fieldName, def.fieldName),
    });

    if (existing) {
      console.log(`   - ${def.fieldName}: already exists, skipping`);
      skipped++;
      continue;
    }

    await db.insert(listingDefaults).values({
      fieldName: def.fieldName,
      defaultValue: def.defaultValue,
      description: def.description,
      updatedBy: null, // System-created
    });

    console.log(`   ✓ ${def.fieldName}: created`);
    created++;
  }

  console.log(`\n   Created: ${created}, Skipped: ${skipped}`);
}

async function main() {
  console.log("================================================");
  console.log("  Okapi Care Network - Admin & Defaults Seeder");
  console.log("================================================\n");

  try {
    await seedAdmin();
    await seedListingDefaults();

    console.log("\n✅ Seeding complete!");
    console.log("\n📌 Admin Login:");
    console.log(`   URL:      /admin/login`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log("\n⚠️  Change the password after first login!");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
