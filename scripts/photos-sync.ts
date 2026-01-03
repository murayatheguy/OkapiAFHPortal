#!/usr/bin/env npx tsx
/**
 * Photo Sync CLI
 *
 * Syncs Google Places photos for facilities.
 *
 * Usage:
 *   pnpm photos:sync                    # Sync all facilities needing photos
 *   pnpm photos:sync --limit 10         # Process first 10 facilities
 *   pnpm photos:sync --facility abc123  # Sync specific facility
 *   pnpm photos:sync --dry-run          # Preview without changes
 *   pnpm photos:sync --force            # Re-sync even recently synced
 *   pnpm photos:sync --check            # Check configuration only
 */

import "dotenv/config";
import { getPhotoSyncService, type PhotoSyncConfig } from "../server/google-places";

// ============================================================================
// CLI Arguments Parser
// ============================================================================

interface CliArgs {
  limit?: number;
  facilityId?: string;
  dryRun: boolean;
  force: boolean;
  check: boolean;
  verbose: boolean;
  batchSize?: number;
  maxPhotos?: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    dryRun: false,
    force: false,
    check: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--limit":
      case "-l":
        result.limit = parseInt(args[++i], 10);
        break;
      case "--facility":
      case "-f":
        result.facilityId = args[++i];
        break;
      case "--dry-run":
      case "-n":
        result.dryRun = true;
        break;
      case "--force":
        result.force = true;
        break;
      case "--check":
      case "-c":
        result.check = true;
        break;
      case "--verbose":
      case "-v":
        result.verbose = true;
        break;
      case "--batch-size":
        result.batchSize = parseInt(args[++i], 10);
        break;
      case "--max-photos":
        result.maxPhotos = parseInt(args[++i], 10);
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Photo Sync CLI - Enrich facilities with Google Places photos

Usage:
  pnpm photos:sync [options]

Options:
  -l, --limit <n>       Process only first N facilities
  -f, --facility <id>   Sync a specific facility by ID
  -n, --dry-run         Preview changes without writing to DB
      --force           Re-sync even recently synced facilities
  -c, --check           Check configuration and exit
  -v, --verbose         Verbose output
      --batch-size <n>  Facilities per batch (default: 10)
      --max-photos <n>  Max photos per facility (default: 5)
  -h, --help            Show this help

Examples:
  pnpm photos:sync                    # Sync all facilities
  pnpm photos:sync --limit 50         # First 50 facilities
  pnpm photos:sync -f abc123 -v       # Single facility, verbose
  pnpm photos:sync --dry-run --limit 5  # Preview 5 facilities

Environment Variables:
  GOOGLE_MAPS_API_KEY   Google Places API key (required)
  AWS_ACCESS_KEY_ID     S3/R2 access key (for photo storage)
  AWS_SECRET_ACCESS_KEY S3/R2 secret key
  S3_BUCKET             S3 bucket name (default: okapi-files)
`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const args = parseArgs();

  console.log("=".repeat(60));
  console.log("  Okapi Photo Sync - Google Places Photo Enrichment");
  console.log("=".repeat(60));
  console.log();

  // Build config
  const config: Partial<PhotoSyncConfig> = {
    dryRun: args.dryRun,
  };

  if (args.batchSize) config.batchSize = args.batchSize;
  if (args.maxPhotos) config.maxPhotosPerFacility = args.maxPhotos;

  const service = getPhotoSyncService(config);

  // Check configuration
  const { ready, issues } = service.isReady();

  console.log("Configuration Check:");
  console.log(`  Google Places API: ${process.env.GOOGLE_MAPS_API_KEY ? "Configured" : "NOT CONFIGURED"}`);
  console.log(`  S3 Storage: ${process.env.AWS_ACCESS_KEY_ID ? "Configured" : "NOT CONFIGURED"}`);
  console.log(`  Dry Run: ${args.dryRun ? "Yes" : "No"}`);
  console.log();

  if (issues.length > 0) {
    console.log("Issues:");
    issues.forEach((issue) => console.log(`  - ${issue}`));
    console.log();
  }

  if (args.check) {
    console.log(ready ? "Ready to sync!" : "Configuration incomplete.");
    process.exit(ready ? 0 : 1);
  }

  if (!ready) {
    console.error("Cannot proceed - configuration incomplete.");
    process.exit(1);
  }

  // Run sync
  console.log("Starting sync...");
  console.log();

  const startTime = Date.now();

  try {
    const result = await service.syncAllFacilities({
      limit: args.limit,
      facilityIds: args.facilityId ? [args.facilityId] : undefined,
      forceResync: args.force,
    });

    console.log();
    console.log("=".repeat(60));
    console.log("  Sync Complete");
    console.log("=".repeat(60));
    console.log();
    console.log("Results:");
    console.log(`  Batch ID: ${result.batchId}`);
    console.log(`  Total Facilities: ${result.totalFacilities}`);
    console.log(`  Processed: ${result.facilitiesProcessed}`);
    console.log(`  Skipped: ${result.facilitiesSkipped}`);
    console.log(`  Failed: ${result.facilitiesFailed}`);
    console.log();
    console.log("Photos:");
    console.log(`  Downloaded: ${result.photosDownloaded}`);
    console.log(`  Uploaded: ${result.photosUploaded}`);
    console.log(`  Failed: ${result.photosFailed}`);
    console.log();
    console.log("API Usage:");
    console.log(`  API Calls: ${result.apiCallsUsed}`);
    console.log(`  Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
    console.log();

    if (result.errors.length > 0 && args.verbose) {
      console.log("Errors:");
      result.errors.forEach(({ facilityId, error }) => {
        console.log(`  ${facilityId}: ${error}`);
      });
      console.log();
    }

    if (args.dryRun) {
      console.log("(Dry run - no changes were made)");
    }

    process.exit(result.facilitiesFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error();
    console.error("Sync failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
