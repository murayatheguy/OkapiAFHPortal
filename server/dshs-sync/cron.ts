import * as cron from 'node-cron';
import { getSyncService } from './sync-service';

let cronJob: ReturnType<typeof cron.schedule> | null = null;

export function startDSHSCronJob(): void {
  if (cronJob) {
    console.log('[DSHS Cron] Cron job already running');
    return;
  }

  cronJob = cron.schedule('0 3 * * *', async () => {
    console.log('[DSHS Cron] Starting daily DSHS sync...');

    const syncService = getSyncService();

    try {
      const result = await syncService.fullSync();
      console.log('[DSHS Cron] Sync complete:', result);
    } catch (error) {
      console.error('[DSHS Cron] Sync failed:', error);
    }
  }, {
    timezone: 'America/Los_Angeles'
  });

  console.log('[DSHS Cron] DSHS sync scheduler started - runs daily at 3 AM Pacific');
}

export function stopDSHSCronJob(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[DSHS Cron] Cron job stopped');
  }
}
