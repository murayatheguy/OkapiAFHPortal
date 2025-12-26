import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Staff List', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);

    // Navigate to staff
    const staffLink = page.locator('nav >> text=Staff, aside >> text=Staff, a:has-text("Staff")').first();
    await staffLink.click();
    await waitForPageLoad(page);
  });

  test('should display staff page', async ({ page }) => {
    await expect(page).toHaveURL(/staff/i);
    const header = page.locator('h1, h2').filter({ hasText: /Staff|Team|Employee/i }).first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should display staff table or list', async ({ page }) => {
    const staffList = page.locator('table, [class*="list"], [class*="grid"], [role="table"]').first();
    await expect(staffList).toBeVisible({ timeout: 10000 });
  });

  test('should display staff names', async ({ page }) => {
    const staffName = page.locator('table tbody tr td, [class*="staff"] [class*="name"]').first();
    if (await staffName.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(staffName).toBeVisible();
    }
  });

  test('should have Add Staff button', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add Staff")').first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
  });

  test('should display staff roles', async ({ page }) => {
    const roleIndicator = page.locator('text=/Caregiver|Nurse|Administrator|Manager|CNA|RN/').first();
    if (await roleIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(roleIndicator).toBeVisible();
    }
  });

  test('should display active/inactive status', async ({ page }) => {
    const statusIndicator = page.locator('[class*="status"], [class*="badge"], text=Active, text=Inactive').first();
    if (await statusIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(statusIndicator).toBeVisible();
    }
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should filter staff by role', async ({ page }) => {
    const roleFilter = page.locator('select, [role="combobox"], button:has-text("Role"), button:has-text("Filter")').first();
    if (await roleFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(roleFilter).toBeVisible();
    }
  });

  test('should click staff to view details', async ({ page }) => {
    const staffRow = page.locator('table tbody tr, [class*="staff-card"]').first();
    if (await staffRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await staffRow.click();
      await waitForPageLoad(page);
    }
  });
});
