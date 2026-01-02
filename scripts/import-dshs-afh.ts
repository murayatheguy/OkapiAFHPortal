/**
 * DSHS AFH Import Script
 *
 * Imports 2,730 Adult Family Home facilities from DSHS Excel file.
 *
 * Usage:
 *   npx tsx scripts/import-dshs-afh.ts [--dry-run] [--limit=N]
 *
 * Options:
 *   --dry-run   Preview import without writing to database
 *   --limit=N   Only import first N facilities (for testing)
 */

import 'dotenv/config';
import XLSX from 'xlsx';
import { db } from '../server/db';
import { facilities } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

// Parse command line args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

// DSHS row type
interface DshsRow {
  LicenseNumber: string | number;
  FacilityName: string;
  FacilityType: string;
  FacilityStatus: string;
  LocationAddress: string;
  LocationCity: string;
  LocationState: string;
  LocationZipCode: string | number;
  LocationCounty: string;
  LicensedBedCount: number;
  TelephoneNmbr?: string;
  Speciality?: string;
  contract?: string;
  'Disclosure of Services'?: string;
  'Reports Location'?: string;
}

// Generate URL-friendly slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

// Title case city names
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Map DSHS status to our license status
function mapLicenseStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'OP': 'Active',
    'OP    ': 'Active',
    'OPEN': 'Active',
    'CL': 'Closed',
    'CLOSED': 'Closed',
    'SU': 'Suspended',
    'SUSPENDED': 'Suspended',
    'PR': 'Provisional',
    'PROVISIONAL': 'Provisional',
  };
  return statusMap[status.trim()] || status.trim() || 'Active';
}

// Parse specialties from comma-separated string
function parseSpecialties(specialtyStr: string | undefined): string[] {
  if (!specialtyStr) return [];

  const specialtyMap: Record<string, string> = {
    'Mental Health': 'Mental Health',
    'Dementia': 'Dementia Care',
    'Developmental Disabilities': 'Developmental Disabilities',
    'Traumatic Brain Injury': 'Traumatic Brain Injury',
    'Nursing Facility Transition': 'Nursing Transition',
    'Ventilator': 'Ventilator Care',
    'HIV/AIDS': 'HIV/AIDS Care',
  };

  return specialtyStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => specialtyMap[s] || s);
}

// Check if accepts Medicaid based on contract field
function checkMedicaid(contract: string | undefined): boolean {
  if (!contract) return false;
  const lc = contract.toLowerCase();
  return lc.includes('hcs') || lc.includes('dda') || lc.includes('medicaid');
}

async function importFacilities() {
  console.log('=== DSHS AFH Import Script ===\n');
  console.log('Mode:', isDryRun ? 'DRY RUN (no changes)' : 'LIVE IMPORT');
  if (limit) console.log('Limit:', limit, 'facilities');
  console.log('');

  // Read Excel file
  const workbook = XLSX.readFile('data/AFListing (1).xls');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: DshsRow[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${rows.length} rows in Excel file\n`);

  // Get existing license numbers to avoid duplicates
  const existingFacilities = await db
    .select({ licenseNumber: facilities.licenseNumber })
    .from(facilities);

  const existingLicenses = new Set(existingFacilities.map(f => String(f.licenseNumber)));
  console.log(`Found ${existingLicenses.size} existing facilities in database\n`);

  // Process rows
  const rowsToProcess = limit ? rows.slice(0, limit) : rows;

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const skippedDuplicates: string[] = [];
  const errorList: { license: string; name: string; error: string }[] = [];

  for (const row of rowsToProcess) {
    const licenseNumber = String(row.LicenseNumber).trim();

    // Skip if already exists
    if (existingLicenses.has(licenseNumber)) {
      skipped++;
      if (skippedDuplicates.length < 10) {
        skippedDuplicates.push(`${licenseNumber} - ${row.FacilityName}`);
      }
      continue;
    }

    try {
      // Generate unique slug
      let baseSlug = generateSlug(row.FacilityName);
      let slug = baseSlug;
      let slugCounter = 1;

      // Check for slug conflicts (in a real scenario, you'd check DB)
      // For now, append license number to ensure uniqueness
      slug = `${baseSlug}-${licenseNumber}`;

      const facilityData = {
        name: row.FacilityName.trim(),
        slug,
        facilityType: 'afh' as const,
        address: row.LocationAddress.trim(),
        city: titleCase(row.LocationCity.trim()),
        state: row.LocationState?.trim() || 'WA',
        zipCode: String(row.LocationZipCode).trim(),
        county: row.LocationCounty.trim(),
        capacity: row.LicensedBedCount || 6,
        availableBeds: row.LicensedBedCount || 6,
        licenseNumber,
        licenseStatus: mapLicenseStatus(row.FacilityStatus),
        phone: row.TelephoneNmbr?.trim() || null,
        specialties: parseSpecialties(row.Speciality),
        acceptsMedicaid: checkMedicaid(row.contract),
        acceptsPrivatePay: true, // Default to true
        dshsReportUrl: row['Disclosure of Services'] || null,
        claimStatus: 'unclaimed' as const,
        status: 'active' as const,
        isDemo: false,
        isTemplate: false,
      };

      if (!isDryRun) {
        await db.insert(facilities).values(facilityData);
      }

      imported++;
      existingLicenses.add(licenseNumber); // Prevent duplicates within batch

      if (imported <= 5) {
        console.log(`[${imported}] Imported: ${row.FacilityName} (${licenseNumber})`);
      } else if (imported % 500 === 0) {
        console.log(`... imported ${imported} facilities`);
      }

    } catch (error: any) {
      errors++;
      errorList.push({
        license: licenseNumber,
        name: row.FacilityName,
        error: error.message?.substring(0, 100) || 'Unknown error',
      });

      if (errors <= 5) {
        console.error(`[ERROR] ${row.FacilityName}: ${error.message?.substring(0, 80)}`);
      }
    }
  }

  // Summary
  console.log('\n=== Import Summary ===');
  console.log(`Total rows processed: ${rowsToProcess.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Errors: ${errors}`);

  if (skippedDuplicates.length > 0) {
    console.log('\nSkipped duplicates (first 10):');
    skippedDuplicates.forEach(d => console.log(`  - ${d}`));
  }

  if (errorList.length > 0) {
    console.log('\nErrors (first 10):');
    errorList.slice(0, 10).forEach(e => console.log(`  - ${e.license}: ${e.error}`));
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] No changes were made to the database.');
    console.log('Run without --dry-run to perform actual import.');
  }

  // Verify final count
  if (!isDryRun) {
    const finalCount = await db.select({ count: sql<number>`count(*)` }).from(facilities);
    console.log(`\nFinal facility count: ${finalCount[0].count}`);
  }

  process.exit(0);
}

importFacilities().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
