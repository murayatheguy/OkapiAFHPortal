import { DSHSScraper, WA_COUNTIES, ScrapedHomeDetail } from './scraper';
import { db } from '../db';
import { facilities, dshsSyncLogs, dshsHomeSync } from '@shared/schema';
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

      for (const home of homes) {
        stats.checked++;

        try {
          const detail = await this.scraper.scrapeHomeDetail(home.licenseNumber);
          if (!detail) continue;

          const result = await this.upsertHome(detail);
          if (result.created) stats.added++;
          if (result.updated) stats.updated++;
          stats.inspections += result.newInspections;

        } catch (err) {
          console.error(`[DSHS Sync] Error processing ${home.licenseNumber}:`, err);
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
    const newInspections = 0;

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
    }

    return { created, updated, newInspections };
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
