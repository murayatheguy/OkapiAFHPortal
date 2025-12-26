import { test, expect } from '@playwright/test';
import { getAllTestAccounts } from '../../fixtures/test-accounts';
import { loginAsOwner, logout, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Cross-Facility Staff Tests', () => {
  const accounts = getAllTestAccounts();

  for (const account of accounts) {
    test(`${account.id}: Staff list loads for ${account.facilityName}`, async ({ page }) => {
      await ensureLoggedOut(page);
      await loginAsOwner(page, account);
      await waitForPageLoad(page);

      // Navigate to staff
      const staffLink = page.locator('nav >> text=Staff, aside >> text=Staff, a:has-text("Staff")').first();
      await staffLink.click();
      await waitForPageLoad(page);

      // Verify staff page loads
      await expect(page).toHaveURL(/staff/i);

      // Verify list or table exists
      const staffList = page.locator('table, [class*="list"], [class*="grid"]').first();
      await expect(staffList).toBeVisible({ timeout: 10000 });

      await logout(page);
    });
  }

  test('All facilities can access Add Staff form', async ({ page }) => {
    for (const account of accounts) {
      await ensureLoggedOut(page);
      await loginAsOwner(page, account);
      await waitForPageLoad(page);

      // Navigate to staff
      const staffLink = page.locator('nav >> text=Staff, aside >> text=Staff, a:has-text("Staff")').first();
      await staffLink.click();
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
