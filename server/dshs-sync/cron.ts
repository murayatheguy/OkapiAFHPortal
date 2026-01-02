import * as cron from 'node-cron';
import { getSyncService } from './sync-service';

let cronJob: ReturnType<typeof cron.schedule> | null = null;

// Check if scraping is available (either Browserless.io or local Chromium)
function isScrapingAvailable(): boolean {
  // Browserless.io is available if API key is set
  if (process.env.BROWSERLESS_API_KEY) {
    return true;
  }
  // Local Chromium is available if CHROMIUM_PATH is set or we're in development
  if (process.env.CHROMIUM_PATH || process.env.NODE_ENV === 'development') {
    return true;
  }
  return false;
}

export function startDSHSCronJob(): void {
  if (cronJob) {
    console.log('[DSHS Cron] Cron job already running');
    return;
  }

  // Check if scraping is available
  if (!isScrapingAvailable()) {
    console.log('[DSHS Cron] DSHS sync disabled - no browser available');
    console.log('[DSHS Cron] To enable: Set BROWSERLESS_API_KEY env variable');
    console.log('[DSHS Cron] Get a free API key at: https://www.browserless.io/');
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

  const browserType = process.env.BROWSERLESS_API_KEY ? 'Browserless.io' : 'local Chromium';
  console.log(`[DSHS Cron] DSHS sync scheduler started - runs daily at 3 AM Pacific (using ${browserType})`);
}

export function stopDSHSCronJob(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[DSHS Cron] Cron job stopped');
  }
}
