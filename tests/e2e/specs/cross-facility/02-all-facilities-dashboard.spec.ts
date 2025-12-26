import { test, expect } from '@playwright/test';
import { getAllTestAccounts } from '../../fixtures/test-accounts';
import { loginAsOwner, logout, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Cross-Facility Dashboard Tests', () => {
  const accounts = getAllTestAccounts();

  for (const account of accounts) {
    test(`${account.id}: Dashboard loads with correct facility data`, async ({ page }) => {
      await ensureLoggedOut(page);
      await loginAsOwner(page, account);
      await waitForPageLoad(page);

      // Verify dashboard loads
      const dashboard = page.locator('text=Dashboard, text=Overview, nav, aside').first();
      await expect(dashboard).toBeVisible({ timeout: 10000 });

      // Verify resident section exists
      const residentSection = page.locator('text=Resident, text=resident').first();
      await expect(residentSection).toBeVisible({ timeout: 5000 });

      // Verify staff section exists
      const staffSection = page.locator('text=Staff, text=staff').first();
      await expect(staffSection).toBeVisible({ timeout: 5000 });

      await logout(page);
    });
  }

  test('All facilities have consistent navigation structure', async ({ page }) => {
    for (const account of accounts) {
      await ensureLoggedOut(page);
      await loginAsOwner(page, account);
      await waitForPageLoad(page);

      // Check for consistent navigation items
      const residentsNav = page.locator('nav >> text=Resident, aside >> text=Resident').first();
      const staffNav = page.locator('nav >> text=Staff, aside >> text=Staff').first();
      const settingsNav = page.locator('nav >> text=Setting, aside >> text=Setting').first();

      await expect(residentsNav).toBeVisible({ timeout: 5000 });
      await expect(staffNav).toBeVisible({ timeout: 5000 });
      await expect(settingsNav).toBeVisible({ timeout: 5000 });

      await logout(page);
    }
  });
});
