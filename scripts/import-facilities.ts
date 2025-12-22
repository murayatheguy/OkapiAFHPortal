import "dotenv/config";
import * as XLSX from "xlsx";
import { db } from "../server/db";
import { facilities } from "../shared/schema";
import { eq, or } from "drizzle-orm";

// Column indexes (0-based, so column 1 = index 0)
const COL_SPECIALTIES = 0;  // Column 1
const COL_NAME = 6;         // Column 7
const COL_ADDRESS = 8;      // Column 9
const COL_CITY = 9;         // Column 10
const COL_STATE = 10;       // Column 11
const COL_ZIPCODE = 11;     // Column 12

const BATCH_SIZE = 500;
const BATCH_DELAY_MS = 100;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-")          // Replace spaces with dashes
    .replace(/-+/g, "-")           // Replace multiple dashes with single
    .replace(/^-|-$/g, "");        // Remove leading/trailing dashes
}

function parseSpecialties(value: string | undefined): string[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function extractZipCode(value: string | number | undefined): string {
  if (!value) return "";
  const str = String(value).trim();
  // Extract first 5 digits
  const match = str.match(/^\d{5}/);
  return match ? match[0] : str.slice(0, 5);
}

interface FacilityRow {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  specialties: string[];
  slug: string;
}

async function importFacilities(filePath: string) {
  console.log("\n=== Bulk Import: Washington State AFHs ===\n");
  console.log(`Reading file: ${filePath}`);

  // Read Excel file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to array of arrays (raw data)
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Total rows in file: ${rawData.length}`);

  // Skip header row if present (check if first row looks like headers)
  const startRow = rawData.length > 0 && typeof rawData[0][COL_NAME] === "string" &&
    rawData[0][COL_NAME].toLowerCase().includes("name") ? 1 : 0;

  // Filter for WA state only (case-insensitive)
  const waRows = rawData.slice(startRow).filter((row) => {
    const state = row[COL_STATE];
    return state && String(state).trim().toUpperCase() === "WA";
  });

  console.log(`WA state rows: ${waRows.length}`);

  // Deduplicate by facility name (keep first occurrence)
  const seenNames = new Set<string>();
  const uniqueFacilities: FacilityRow[] = [];

  for (const row of waRows) {
    const rawName = row[COL_NAME];
    if (!rawName) continue;

    const name = String(rawName).trim();
    const nameKey = name.toLowerCase();

    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);

    uniqueFacilities.push({
      name,
      address: row[COL_ADDRESS] ? String(row[COL_ADDRESS]).trim() : "",
      city: row[COL_CITY] ? String(row[COL_CITY]).trim() : "",
      state: "WA",
      zipCode: extractZipCode(row[COL_ZIPCODE]),
      specialties: parseSpecialties(row[COL_SPECIALTIES]),
      slug: generateSlug(name),
    });
  }

  console.log(`Unique facilities after deduplication: ${uniqueFacilities.length}`);

  // Import stats
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches
  const totalBatches = Math.ceil(uniqueFacilities.length / BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, uniqueFacilities.length);
    const batch = uniqueFacilities.slice(start, end);

    console.log(`\nImporting batch ${batchIndex + 1} of ${totalBatches}...`);

    for (const facility of batch) {
      try {
        // Check if facility with same name OR same slug already exists
        const existing = await db
          .select({ id: facilities.id })
          .from(facilities)
          .where(
            or(
              eq(facilities.name, facility.name),
              eq(facilities.slug, facility.slug)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Insert new facility
        await db.insert(facilities).values({
          name: facility.name,
          address: facility.address,
          city: facility.city,
          state: facility.state,
          zipCode: facility.zipCode,
          county: "", // Will need to be populated later
          specialties: facility.specialties,
          capacity: 6,
          availableBeds: 6,
          claimStatus: "unclaimed",
          status: "active",
          slug: facility.slug,
          phone: null,
          licenseNumber: `IMPORT-${Date.now()}-${imported}`, // Temporary unique license
          licenseStatus: "Unknown",
          email: null,
          featured: false,
        });

        imported++;
      } catch (err: any) {
        errors++;
        if (errors <= 5) {
          console.error(`  Error importing "${facility.name}": ${err.message}`);
        } else if (errors === 6) {
          console.error("  (suppressing further error messages...)");
        }
      }
    }

    // Small delay between batches
    if (batchIndex < totalBatches - 1) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Summary
  console.log("\n=== Import Summary ===");
  console.log(`Total rows in file: ${rawData.length - startRow}`);
  console.log(`WA state rows: ${waRows.length}`);
  console.log(`Unique facilities: ${uniqueFacilities.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log("======================\n");

  process.exit(0);
}

// Get file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: npx tsx scripts/import-facilities.ts <path-to-excel-file>");
  console.error("Example: npx tsx scripts/import-facilities.ts ./data/facilities.xlsx");
  process.exit(1);
}

importFacilities(filePath).catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
