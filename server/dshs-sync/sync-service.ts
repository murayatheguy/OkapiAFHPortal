import { DSHSScraper, WA_COUNTIES, ScrapedHomeDetail } from './scraper';
import { db } from '../db';
import { facilities, dshsSyncLogs, dshsHomeSync, dshsInspections } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

interface SyncStats {
  checked: number;
  added: number;
  updated: number;
  inspections: number;
}

interface SyncResult {
  success: boolean;
  checked: number;
  added: number;
  updated: number;
  inspections: number;
  error?: string;
}

export class DSHSSyncService {
  private scraper: DSHSScraper;

  constructor() {
    this.scraper = new DSHSScraper();
  }

  async fullSync(): Promise<SyncResult> {
    const [syncLog] = await db.insert(dshsSyncLogs).values({
      syncType: 'full',
      startedAt: new Date(),
      status: 'running'
    }).returning();

    const stats: SyncStats = { checked: 0, added: 0, updated: 0, inspections: 0 };

    try {
      await this.scraper.init();

      for (const county of WA_COUNTIES) {
        console.log(`[DSHS Sync] Syncing ${county} County...`);

        try {
          const homes = await this.scraper.scrapeCounty(county);
          console.log(`[DSHS Sync] Found ${homes.length} homes in ${county}`);

          for (const home of homes) {
            stats.checked++;

            try {
              const detail = await this.scraper.scrapeHomeDetail(home.licenseNumber);
              if (!detail) continue;

              const result = await this.upsertHome(detail);
              if (result.created) stats.added++;
              if (result.updated) stats.updated++;
              stats.inspections += result.newInspections;

              await db.update(dshsSyncLogs)
                .set({
                  homesChecked: stats.checked,
                  homesAdded: stats.added,
                  homesUpdated: stats.updated,
                  inspectionsAdded: stats.inspections
                })
                .where(eq(dshsSyncLogs.id, syncLog.id));

            } catch (err) {
              console.error(`[DSHS Sync] Error processing ${home.licenseNumber}:`, err);
            }

            await this.delay(1500);
          }
        } catch (err) {
          console.error(`[DSHS Sync] Error syncing ${county}:`, err);
        }
      }

      await db.update(dshsSyncLogs)
        .set({
          completedAt: new Date(),
          status: 'success',
          homesChecked: stats.checked,
          homesAdded: stats.added,
          homesUpdated: stats.updated,
          inspectionsAdded: stats.inspections
        })
        .where(eq(dshsSyncLogs.id, syncLog.id));

      return { success: true, ...stats };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await db.update(dshsSyncLogs)
        .set({
          completedAt: new Date(),
          status: 'failed',
          errorMessage
        })
        .where(eq(dshsSyncLogs.id, syncLog.id));

      return { success: false, ...stats, error: errorMessage };

    } finally {
      await this.scraper.close();
    }
  }

  async syncSingleCounty(county: string): Promise<SyncResult> {
    const [syncLog] = await db.insert(dshsSyncLogs).values({
      syncType: 'single',
      startedAt: new Date(),
      status: 'running'
    }).returning();

    const stats: SyncStats = { checked: 0, added: 0, updated: 0, inspections: 0 };

    try {
      await this.scraper.init();

      console.log(`[DSHS Sync] Syncing ${county} County...`);
      const homes = await this.scraper.scrapeCounty(county);
      console.log(`[DSHS Sync] Found ${homes.length} homes in ${county}`);

      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 5;

      for (const home of homes) {
        stats.checked++;

        try {
          const detail = await this.scraper.scrapeHomeDetail(home.licenseNumber);
          if (!detail) continue;

          const result = await this.upsertHome(detail);
          if (result.created) stats.added++;
          if (result.updated) stats.updated++;
          stats.inspections += result.newInspections;
          
          consecutiveErrors = 0;

        } catch (err: any) {
          console.error(`[DSHS Sync] Error processing ${home.licenseNumber}:`, err);
          consecutiveErrors++;
          
          if (err.message?.includes('Connection closed') || err.message?.includes('Target closed')) {
            console.log(`[DSHS Sync] Browser connection lost, reinitializing...`);
            try {
              await this.scraper.close();
              await this.delay(3000);
              await this.scraper.init();
              console.log(`[DSHS Sync] Browser reinitialized successfully`);
              consecutiveErrors = 0;
            } catch (reinitErr) {
              console.error(`[DSHS Sync] Failed to reinitialize browser:`, reinitErr);
            }
          }
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.error(`[DSHS Sync] Too many consecutive errors (${consecutiveErrors}), stopping sync`);
            break;
          }
        }

        await this.delay(1500);
      }

      await db.update(dshsSyncLogs)
        .set({
          completedAt: new Date(),
          status: 'success',
          homesChecked: stats.checked,
          homesAdded: stats.added,
          homesUpdated: stats.updated,
          inspectionsAdded: stats.inspections
        })
        .where(eq(dshsSyncLogs.id, syncLog.id));

      return { success: true, ...stats };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await db.update(dshsSyncLogs)
        .set({
          completedAt: new Date(),
          status: 'failed',
          errorMessage
        })
        .where(eq(dshsSyncLogs.id, syncLog.id));

      return { success: false, ...stats, error: errorMessage };

    } finally {
      await this.scraper.close();
    }
  }

  private async upsertHome(data: ScrapedHomeDetail): Promise<{ created: boolean; updated: boolean; newInspections: number }> {
    let created = false;
    let updated = false;
    let newInspections = 0;
    let facilityId: string;

    const [existingFacility] = await db.select()
      .from(facilities)
      .where(eq(facilities.licenseNumber, data.licenseNumber))
      .limit(1);

    const [syncRecord] = await db.select()
      .from(dshsHomeSync)
      .where(eq(dshsHomeSync.licenseNumber, data.licenseNumber))
      .limit(1);

    const dataChanged = !syncRecord || syncRecord.lastDataHash !== data.dataHash;

    if (!existingFacility) {
      const slug = this.generateSlug(data.name, data.city, data.licenseNumber);
      
      const [newFacility] = await db.insert(facilities).values({
        name: data.name,
        slug,
        licenseNumber: data.licenseNumber,
        licenseStatus: data.licenseStatus,
        capacity: data.licensedCapacity,
        availableBeds: 0,
        address: data.address,
        city: data.city,
        state: 'WA',
        zipCode: data.zipCode,
        county: data.county,
        phone: data.phone,
        claimStatus: 'unclaimed',
        status: data.licenseStatus === 'Active' ? 'active' : 'inactive',
        acceptsMedicaid: false,
        acceptsPrivatePay: true,
        featured: false,
        acceptingInquiries: 'accepting'
      }).returning();

      facilityId = newFacility.id;

      await db.insert(dshsHomeSync).values({
        facilityId: newFacility.id,
        licenseNumber: data.licenseNumber,
        lastSyncedAt: new Date(),
        lastDataHash: data.dataHash,
        syncStatus: 'synced'
      }).onConflictDoUpdate({
        target: dshsHomeSync.licenseNumber,
        set: {
          facilityId: newFacility.id,
          lastSyncedAt: new Date(),
          lastDataHash: data.dataHash,
          syncStatus: 'synced',
          updatedAt: new Date()
        }
      });

      created = true;

    } else if (dataChanged) {
      facilityId = existingFacility.id;

      await db.update(facilities)
        .set({
          licenseStatus: data.licenseStatus,
          capacity: data.licensedCapacity,
          phone: data.phone,
          status: data.licenseStatus === 'Active' ? 'active' : 'inactive',
          updatedAt: new Date()
        })
        .where(eq(facilities.id, existingFacility.id));

      await db.insert(dshsHomeSync).values({
        facilityId: existingFacility.id,
        licenseNumber: data.licenseNumber,
        lastSyncedAt: new Date(),
        lastDataHash: data.dataHash,
        syncStatus: 'synced'
      }).onConflictDoUpdate({
        target: dshsHomeSync.licenseNumber,
        set: {
          lastSyncedAt: new Date(),
          lastDataHash: data.dataHash,
          syncStatus: 'synced',
          updatedAt: new Date()
        }
      });

      updated = true;
    } else {
      facilityId = existingFacility.id;
    }

    // Sync inspections
    if (data.inspections && data.inspections.length > 0) {
      // Delete existing inspections for this facility and re-insert fresh data
      await db.delete(dshsInspections).where(eq(dshsInspections.facilityId, facilityId));

      for (const inspection of data.inspections) {
        try {
          const inspectionDate = this.parseInspectionDate(inspection.date);
          if (inspectionDate) {
            await db.insert(dshsInspections).values({
              facilityId,
              inspectionDate,
              inspectionType: inspection.type,
              violationCount: inspection.violations,
              scrapedAt: new Date()
            });
            newInspections++;
          }
        } catch (err) {
          console.error(`[DSHS Sync] Error inserting inspection for ${data.licenseNumber}:`, err);
        }
      }
    }

    return { created, updated, newInspections };
  }

  private parseInspectionDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Try various date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
      /(\d{4})-(\d{2})-(\d{2})/,         // YYYY-MM-DD
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        } else {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        }
      }
    }
    
    // Try direct parsing
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private generateSlug(name: string, city: string, licenseNumber: string): string {
    const base = `${name}-${city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${base}-${licenseNumber}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

let syncServiceInstance: DSHSSyncService | null = null;

export function getSyncService(): DSHSSyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new DSHSSyncService();
  }
  return syncServiceInstance;
}
