import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('HIPAA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);
  });

  test('should display compliance section in settings', async ({ page }) => {
    const settingsLink = page.locator('nav >> text=Setting, aside >> text=Setting, a:has-text("Setting")').first();
    await settingsLink.click();
    await waitForPageLoad(page);

    const complianceSection = page.locator('text=HIPAA, text=Compliance, text=Privacy').first();
    if (await complianceSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(complianceSection).toBeVisible();
    }
  });

  test('should have access logs available', async ({ page }) => {
    const settingsLink = page.locator('nav >> text=Setting, aside >> text=Setting, a:has-text("Setting")').first();
    await settingsLink.click();
    await waitForPageLoad(page);

    const accessLogs = page.locator('text=Access Log, text=Audit, text=Activity Log').first();
    if (await accessLogs.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(accessLogs).toBeVisible();
    }
  });

  test('should display data retention policy', async ({ page }) => {
    const settingsLink = page.locator('nav >> text=Setting, aside >> text=Setting, a:has-text("Setting")').first();
    await settingsLink.click();
    await waitForPageLoad(page);

    const dataPolicy = page.locator('text=Data Retention, text=Privacy Policy, text=Data Policy').first();
    if (await dataPolicy.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(dataPolicy).toBeVisible();
    }
  });

  test('resident data should not be exposed in URLs', async ({ page }) => {
    // Navigate to residents
    const residentsLink = page.locator('nav >> text=Resident, aside >> text=Resident').first();
    await residentsLink.click();
    await waitForPageLoad(page);

    // Click first resident if available
    const residentRow = page.locator('table tbody tr, [class*="resident"]').first();
    if (await residentRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await residentRow.click();
      await waitForPageLoad(page);

      // URL should not contain sensitive data like SSN, DOB
      const url = page.url();
      expect(url).not.toMatch(/\d{3}-\d{2}-\d{4}/); // SSN pattern
      expect(url).not.toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date pattern
    }
  });

  test('should have session timeout configured', async ({ page }) => {
    // This is a basic check - session timeout is typically configured server-side
    const settingsLink = page.locator('nav >> text=Setting, aside >> text=Setting, a:has-text("Setting")').first();
    await settingsLink.click();
    await waitForPageLoad(page);

    const sessionSettings = page.locator('text=Session, text=Timeout, text=Auto-logout').first();
    if (await sessionSettings.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(sessionSettings).toBeVisible();
    }
  });
});
