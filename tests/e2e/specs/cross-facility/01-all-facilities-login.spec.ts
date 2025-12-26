import { test, expect } from '@playwright/test';
import { getAllTestAccounts } from '../../fixtures/test-accounts';
import { loginAsOwner, logout, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Cross-Facility Login Tests', () => {
  const accounts = getAllTestAccounts();

  for (const account of accounts) {
    test(`should login to ${account.id}: ${account.facilityName}`, async ({ page }) => {
      await ensureLoggedOut(page);
      await loginAsOwner(page, account);

      await expect(page).toHaveURL(/dashboard|owner/, { timeout: 15000 });
      await waitForPageLoad(page);

      // Verify we're logged in
      const dashboardContent = page.locator('text=Dashboard, text=Welcome, nav, aside').first();
      await expect(dashboardContent).toBeVisible({ timeout: 10000 });

      await logout(page);
    });
  }

  test('should login and logout all 10 facilities sequentially', async ({ page }) => {
    for (const account of accounts) {
      await ensureLoggedOut(page);
      await loginAsOwner(page, account);

      await expect(page).toHaveURL(/dashboard|owner/, { timeout: 15000 });
      await waitForPageLoad(page);

      // Quick verification
      const content = page.locator('nav, aside').first();
      await expect(content).toBeVisible({ timeout: 10000 });

      await logout(page);
      await expect(page).toHaveURL(/login|\//);
    }
  });
});
