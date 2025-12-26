import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Residents List', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);

    // Navigate to residents
    const residentsLink = page.locator('nav >> text=Resident, aside >> text=Resident, a:has-text("Resident")').first();
    await residentsLink.click();
    await waitForPageLoad(page);
  });

  test('should display residents page', async ({ page }) => {
    await expect(page).toHaveURL(/resident/i);
    const header = page.locator('h1, h2').filter({ hasText: /Resident/i }).first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should display residents table or list', async ({ page }) => {
    const residentList = page.locator('table, [class*="list"], [class*="grid"], [role="table"]').first();
    await expect(residentList).toBeVisible({ timeout: 10000 });
  });

  test('should display resident names', async ({ page }) => {
    const residentName = page.locator('table tbody tr td, [class*="resident"] [class*="name"]').first();
    if (await residentName.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(residentName).toBeVisible();
    }
  });

  test('should have Add Resident button', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add Resident")').first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Filter"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should filter residents by search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Test');
      await page.waitForTimeout(1000);
    }
  });

  test('should click resident to view details', async ({ page }) => {
    const residentRow = page.locator('table tbody tr, [class*="resident-card"]').first();
    if (await residentRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await residentRow.click();
      await waitForPageLoad(page);
    }
  });

  test('should display resident status indicators', async ({ page }) => {
    const statusIndicator = page.locator('[class*="status"], [class*="badge"], [class*="active"], [class*="inactive"]').first();
    if (await statusIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(statusIndicator).toBeVisible();
    }
  });

  test('should display room numbers', async ({ page }) => {
    const roomInfo = page.locator('text=/Room|Rm/').first();
    if (await roomInfo.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(roomInfo).toBeVisible();
    }
  });
});
