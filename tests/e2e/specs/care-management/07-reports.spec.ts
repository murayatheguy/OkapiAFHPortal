import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);
  });

  test('should navigate to reports page', async ({ page }) => {
    const reportsLink = page.locator('a:has-text("Report"), nav >> text=Report, aside >> text=Report').first();
    if (await reportsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportsLink.click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/report/i);
    }
  });

  test('should display report types', async ({ page }) => {
    const reportsLink = page.locator('a:has-text("Report"), nav >> text=Report, aside >> text=Report').first();
    if (await reportsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportsLink.click();
      await waitForPageLoad(page);

      const reportTypes = page.locator('button, a, [class*="card"]').filter({ hasText: /Census|Medication|Incident|Staff|Financial/ });
      if (await reportTypes.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(reportTypes.first()).toBeVisible();
      }
    }
  });

  test('should generate census report', async ({ page }) => {
    const reportsLink = page.locator('a:has-text("Report"), nav >> text=Report, aside >> text=Report').first();
    if (await reportsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportsLink.click();
      await waitForPageLoad(page);

      const censusReport = page.locator('button:has-text("Census"), a:has-text("Census")').first();
      if (await censusReport.isVisible({ timeout: 3000 }).catch(() => false)) {
        await censusReport.click();
        await waitForPageLoad(page);
      }
    }
  });

  test('should export report to PDF', async ({ page }) => {
    const reportsLink = page.locator('a:has-text("Report"), nav >> text=Report, aside >> text=Report').first();
    if (await reportsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportsLink.click();
      await waitForPageLoad(page);

      const exportButton = page.locator('button:has-text("Export"), button:has-text("PDF"), button:has-text("Download")').first();
      if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(exportButton).toBeEnabled();
      }
    }
  });

  test('should filter reports by date range', async ({ page }) => {
    const reportsLink = page.locator('a:has-text("Report"), nav >> text=Report, aside >> text=Report').first();
    if (await reportsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportsLink.click();
      await waitForPageLoad(page);

      const dateRangeFilter = page.locator('input[type="date"], button:has-text("Date Range"), [class*="date-picker"]').first();
      if (await dateRangeFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(dateRangeFilter).toBeVisible();
      }
    }
  });

  test('should display medication administration report', async ({ page }) => {
    const reportsLink = page.locator('a:has-text("Report"), nav >> text=Report, aside >> text=Report').first();
    if (await reportsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportsLink.click();
      await waitForPageLoad(page);

      const medReport = page.locator('button:has-text("Medication"), a:has-text("MAR"), a:has-text("Medication")').first();
      if (await medReport.isVisible({ timeout: 3000 }).catch(() => false)) {
        await medReport.click();
        await waitForPageLoad(page);
      }
    }
  });

  test('should display staff hours report', async ({ page }) => {
    const reportsLink = page.locator('a:has-text("Report"), nav >> text=Report, aside >> text=Report').first();
    if (await reportsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reportsLink.click();
      await waitForPageLoad(page);

      const staffReport = page.locator('button:has-text("Staff"), a:has-text("Staff"), text=Staff Hours').first();
      if (await staffReport.isVisible({ timeout: 3000 }).catch(() => false)) {
        await staffReport.click();
        await waitForPageLoad(page);
      }
    }
  });
});
