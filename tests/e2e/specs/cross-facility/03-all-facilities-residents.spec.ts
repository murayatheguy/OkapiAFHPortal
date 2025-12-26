import { test, expect } from '@playwright/test';
import { getAllTestAccounts } from '../../fixtures/test-accounts';
import { loginAsOwner, logout, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Cross-Facility Residents Tests', () => {
  const accounts = getAllTestAccounts();

  for (const account of accounts) {
    test(`${account.id}: Residents list loads for ${account.facilityName}`, async ({ page }) => {
      await ensureLoggedOut(page);
      await loginAsOwner(page, account);
      await waitForPageLoad(page);

      // Navigate to residents
      const residentsLink = page.locator('nav >> text=Resident, aside >> text=Resident, a:has-text("Resident")').first();
      await residentsLink.click();
      await waitForPageLoad(page);

      // Verify residents page loads
      await expect(page).toHaveURL(/resident/i);

      // Verify list or table exists
      const residentList = page.locator('table, [class*="list"], [class*="grid"]').first();
      await expect(residentList).toBeVisible({ timeout: 10000 });

      await logout(page);
    });
  }

  test('All facilities can access Add Resident form', async ({ page }) => {
    for (const account of accounts) {
      await ensureLoggedOut(page);
      await loginAsOwner(page, account);
      await waitForPageLoad(page);

      // Navigate to residents
      const residentsLink = page.locator('nav >> text=Resident, aside >> text=Resident, a:has-text("Resident")').first();
      await residentsLink.click();
      await waitForPageLoad(page);

      // Click Add button
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add")').first();
      await addButton.click();
      await waitForPageLoad(page);

      // Verify form appears
      const form = page.locator('form, [role="dialog"]');
      await expect(form).toBeVisible({ timeout: 5000 });

      await logout(page);
    }
  });
});
