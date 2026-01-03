/**
 * Photo Sync Service
 *
 * Orchestrates the photo enrichment pipeline:
 * 1. Resolve Google Place ID for facilities
 * 2. Fetch photo references
 * 3. Download and upload photos to S3/R2
 * 4. Store metadata in facility_photos table
 */

import crypto from "crypto";
import { db } from "../db";
import { facilities, facilityPhotos, photoSyncLogs } from "@shared/schema";
import { eq, and, isNull, or, lt, sql } from "drizzle-orm";
import { getPlacesClient, type PlacePhoto } from "./places-client";
import { uploadBuffer, isS3Configured, generateFileKey } from "../storage/s3";
import { logger } from "../utils/logger";

// ============================================================================
// Configuration
// ============================================================================

export interface PhotoSyncConfig {
  /** Max photos to download per facility */
  maxPhotosPerFacility: number;
  /** Batch size for processing facilities */
  batchSize: number;
  /** Delay between batches (ms) */
  batchDelayMs: number;
  /** Max retries per operation */
  maxRetries: number;
  /** Retry delay (ms) */
  retryDelayMs: number;
  /** Skip facilities synced within this time (hours) */
  skipRecentlySyncedHours: number;
  /** Photo dimensions */
  photoMaxWidth: number;
  photoMaxHeight: number;
  /** Dry run mode (no DB writes) */
  dryRun: boolean;
}

const DEFAULT_CONFIG: PhotoSyncConfig = {
  maxPhotosPerFacility: 5,
  batchSize: 10,
  batchDelayMs: 2000,
  maxRetries: 3,
  retryDelayMs: 1000,
  skipRecentlySyncedHours: 24,
  photoMaxWidth: 800,
  photoMaxHeight: 600,
  dryRun: false,
};

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
  batchId: string;
  totalFacilities: number;
  facilitiesProcessed: number;
  facilitiesSkipped: number;
  facilitiesFailed: number;
  photosDownloaded: number;
  photosUploaded: number;
  photosFailed: number;
  apiCallsUsed: number;
  durationMs: number;
  errors: Array<{ facilityId: string; error: string }>;
}

export interface FacilitySyncResult {
  facilityId: string;
  placeIdFound: boolean;
  photosFound: number;
  photosDownloaded: number;
  photosUploaded: number;
  error?: string;
}

// ============================================================================
// Service
// ============================================================================

export class PhotoSyncService {
  private config: PhotoSyncConfig;
  private placesClient = getPlacesClient();

  constructor(config: Partial<PhotoSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if service is ready
   */
  isReady(): { ready: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.placesClient.isConfigured()) {
      issues.push("Google Places API key not configured (GOOGLE_MAPS_API_KEY)");
    }

    if (!isS3Configured()) {
      issues.push("S3/R2 storage not configured (AWS_ACCESS_KEY_ID)");
    }

    return {
      ready: issues.length === 0,
      issues,
    };
  }

  /**
   * Run full sync for all facilities missing photos
   */
  async syncAllFacilities(options?: {
    limit?: number;
    facilityIds?: string[];
    forceResync?: boolean;
  }): Promise<SyncResult> {
    const batchId = crypto.randomUUID();
    const startTime = Date.now();

    const result: SyncResult = {
      batchId,
      totalFacilities: 0,
      facilitiesProcessed: 0,
      facilitiesSkipped: 0,
      facilitiesFailed: 0,
      photosDownloaded: 0,
      photosUploaded: 0,
      photosFailed: 0,
      apiCallsUsed: 0,
      durationMs: 0,
      errors: [],
    };

    // Log batch start
    await this.logOperation(batchId, null, "batch_start", "started");

    try {
      // Get facilities to process
      const facilitiesToSync = await this.getFacilitiesToSync(options);
      result.totalFacilities = facilitiesToSync.length;

      logger.info(
        { batchId, count: facilitiesToSync.length },
        "Starting photo sync batch"
      );

      // Process in batches
      for (let i = 0; i < facilitiesToSync.length; i += this.config.batchSize) {
        const batch = facilitiesToSync.slice(i, i + this.config.batchSize);

        logger.info(
          { batchId, batchNum: Math.floor(i / this.config.batchSize) + 1 },
          "Processing batch"
        );

        for (const facility of batch) {
          try {
            const facilityResult = await this.syncFacility(facility, batchId);

            if (facilityResult.error) {
              result.facilitiesFailed++;
              result.errors.push({
                facilityId: facility.id,
                error: facilityResult.error,
              });
            } else {
              result.facilitiesProcessed++;
            }

            result.photosDownloaded += facilityResult.photosDownloaded;
            result.photosUploaded += facilityResult.photosUploaded;
          } catch (error) {
            result.facilitiesFailed++;
            result.errors.push({
              facilityId: facility.id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        // Delay between batches
        if (i + this.config.batchSize < facilitiesToSync.length) {
          await this.delay(this.config.batchDelayMs);
        }
      }

      result.apiCallsUsed = this.placesClient.getStats().requestCount;
      result.durationMs = Date.now() - startTime;

      // Log batch completion
      await this.logOperation(batchId, null, "batch_complete", "success", {
        itemsProcessed: result.facilitiesProcessed,
        itemsSucceeded: result.facilitiesProcessed,
        itemsFailed: result.facilitiesFailed,
        durationMs: result.durationMs,
        apiCallsUsed: result.apiCallsUsed,
      });

      logger.info({ batchId, result }, "Photo sync batch completed");

      return result;
    } catch (error) {
      result.durationMs = Date.now() - startTime;

      await this.logOperation(batchId, null, "batch_complete", "failed", {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: result.durationMs,
      });

      throw error;
    }
  }

  /**
   * Sync photos for a single facility
   */
  async syncFacility(
    facility: { id: string; name: string; address: string; city: string; state: string; googlePlaceId?: string | null },
    batchId?: string
  ): Promise<FacilitySyncResult> {
    const result: FacilitySyncResult = {
      facilityId: facility.id,
      placeIdFound: false,
      photosFound: 0,
      photosDownloaded: 0,
      photosUploaded: 0,
    };

    try {
      // Step 1: Get or find place ID
      let placeId = facility.googlePlaceId;

      if (!placeId) {
        logger.debug({ facilityId: facility.id }, "Finding place ID");

        const placeResult = await this.withRetry(() =>
          this.placesClient.findPlace({
            name: facility.name,
            address: facility.address,
            city: facility.city,
            state: facility.state,
          })
        );

        if (!placeResult) {
          await this.logOperation(batchId, facility.id, "find_place", "failed", {
            errorMessage: "Place not found",
          });
          result.error = "Place not found in Google Places";
          return result;
        }

        placeId = placeResult.placeId;
        result.placeIdFound = true;

        // Update facility with place ID
        if (!this.config.dryRun) {
          await db
            .update(facilities)
            .set({
              googlePlaceId: placeId,
              googleRating: placeResult.rating?.toString(),
              googleReviewCount: placeResult.userRatingsTotal,
            })
            .where(eq(facilities.id, facility.id));
        }

        await this.logOperation(batchId, facility.id, "find_place", "success", {
          itemsSucceeded: 1,
        });
      } else {
        result.placeIdFound = true;
      }

      // Step 2: Get photo references
      const photos = await this.withRetry(() =>
        this.placesClient.getPlacePhotos(placeId!)
      );

      result.photosFound = photos.length;

      if (photos.length === 0) {
        logger.debug({ facilityId: facility.id }, "No photos found");
        return result;
      }

      await this.logOperation(batchId, facility.id, "fetch_photos", "success", {
        itemsProcessed: photos.length,
        itemsSucceeded: photos.length,
      });

      // Step 3: Download and upload photos
      const photosToProcess = photos.slice(0, this.config.maxPhotosPerFacility);

      for (let i = 0; i < photosToProcess.length; i++) {
        const photo = photosToProcess[i];

        try {
          // Check if we already have this photo (by reference)
          const existing = await db
            .select({ id: facilityPhotos.id })
            .from(facilityPhotos)
            .where(
              and(
                eq(facilityPhotos.facilityId, facility.id),
                eq(facilityPhotos.googlePhotoReference, photo.photoReference)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            logger.debug(
              { facilityId: facility.id, photoRef: photo.photoReference },
              "Photo already exists, skipping"
            );
            continue;
          }

          // Download photo
          const downloadResult = await this.withRetry(() =>
            this.placesClient.downloadPhoto(
              photo.photoReference,
              this.config.photoMaxWidth,
              this.config.photoMaxHeight
            )
          );

          result.photosDownloaded++;

          // Calculate hash for deduplication
          const contentHash = crypto
            .createHash("sha256")
            .update(downloadResult.buffer)
            .digest("hex");

          // Check for duplicate by hash
          const duplicateByHash = await db
            .select({ id: facilityPhotos.id })
            .from(facilityPhotos)
            .where(eq(facilityPhotos.contentHash, contentHash))
            .limit(1);

          if (duplicateByHash.length > 0) {
            logger.debug(
              { facilityId: facility.id, hash: contentHash },
              "Duplicate photo by hash, skipping"
            );
            continue;
          }

          // Upload to S3
          let storageUrl: string | null = null;
          let storageKey: string | null = null;

          if (isS3Configured() && !this.config.dryRun) {
            const ext = downloadResult.mimeType.includes("png") ? "png" : "jpg";
            storageKey = generateFileKey(facility.id, "photos", `google-${i}.${ext}`);
            storageUrl = await uploadBuffer(
              downloadResult.buffer,
              storageKey,
              downloadResult.mimeType
            );
            result.photosUploaded++;
          }

          // Save to database
          if (!this.config.dryRun) {
            await db.insert(facilityPhotos).values({
              facilityId: facility.id,
              source: "google_places",
              googlePhotoReference: photo.photoReference,
              googlePlaceId: placeId,
              storageKey,
              storageUrl,
              width: downloadResult.width,
              height: downloadResult.height,
              contentHash,
              mimeType: downloadResult.mimeType,
              fileSize: downloadResult.buffer.length,
              attributionText: photo.attributionText,
              attributionUrl: photo.attributionUrl,
              photographerName: photo.photographerName,
              isPrimary: i === 0,
              sortOrder: i,
              status: storageUrl ? "active" : "pending",
              fetchedAt: new Date(),
              uploadedAt: storageUrl ? new Date() : null,
            });
          }

          logger.debug(
            { facilityId: facility.id, photoIndex: i },
            "Photo processed successfully"
          );
        } catch (photoError) {
          logger.error(
            { facilityId: facility.id, photoIndex: i, error: photoError },
            "Failed to process photo"
          );
        }
      }

      // Update facility sync timestamp
      if (!this.config.dryRun) {
        await db
          .update(facilities)
          .set({ googleSyncedAt: new Date() })
          .where(eq(facilities.id, facility.id));
      }

      return result;
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      logger.error({ facilityId: facility.id, error }, "Facility sync failed");
      return result;
    }
  }

  /**
   * Get facilities that need photo syncing
   */
  private async getFacilitiesToSync(options?: {
    limit?: number;
    facilityIds?: string[];
    forceResync?: boolean;
  }): Promise<Array<{ id: string; name: string; address: string; city: string; state: string; googlePlaceId: string | null }>> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - this.config.skipRecentlySyncedHours);

    let query = db
      .select({
        id: facilities.id,
        name: facilities.name,
        address: facilities.address,
        city: facilities.city,
        state: facilities.state,
        googlePlaceId: facilities.googlePlaceId,
      })
      .from(facilities)
      .where(
        and(
          eq(facilities.status, "active"),
          eq(facilities.facilityType, "afh"),
          options?.forceResync
            ? sql`true`
            : or(
                isNull(facilities.googleSyncedAt),
                lt(facilities.googleSyncedAt, cutoffDate)
              )
        )
      );

    if (options?.facilityIds && options.facilityIds.length > 0) {
      query = query.where(
        and(
          eq(facilities.status, "active"),
          sql`${facilities.id} = ANY(${options.facilityIds})`
        )
      ) as typeof query;
    }

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }

    return query;
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retries) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt);
          logger.warn(
            { attempt, delay, error: lastError.message },
            "Retrying after error"
          );
          await this.delay(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Log a sync operation
   */
  private async logOperation(
    batchId: string | undefined | null,
    facilityId: string | null,
    operation: string,
    status: string,
    extra?: {
      itemsProcessed?: number;
      itemsSucceeded?: number;
      itemsFailed?: number;
      errorMessage?: string;
      durationMs?: number;
      apiCallsUsed?: number;
    }
  ): Promise<void> {
    if (this.config.dryRun) return;

    try {
      await db.insert(photoSyncLogs).values({
        batchId: batchId || undefined,
        facilityId,
        operation,
        status,
        itemsProcessed: extra?.itemsProcessed ?? 0,
        itemsSucceeded: extra?.itemsSucceeded ?? 0,
        itemsFailed: extra?.itemsFailed ?? 0,
        errorMessage: extra?.errorMessage,
        durationMs: extra?.durationMs,
        apiCallsUsed: extra?.apiCallsUsed,
        completedAt: status !== "started" ? new Date() : null,
      });
    } catch (error) {
      logger.error({ error }, "Failed to log sync operation");
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let serviceInstance: PhotoSyncService | null = null;

export function getPhotoSyncService(
  config?: Partial<PhotoSyncConfig>
): PhotoSyncService {
  if (!serviceInstance || config) {
    serviceInstance = new PhotoSyncService(config);
  }
  return serviceInstance;
}
