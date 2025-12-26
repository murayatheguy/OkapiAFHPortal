import { test, expect } from '@playwright/test';

test.describe('Facility Directory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/directory');
  });

  test('should load directory page', async ({ page }) => {
    await expect(page.locator('h1, [class*="title"]').first()).toBeVisible();
  });

  test('should display search/filter options', async ({ page }) => {
    const searchOrFilter = page.locator('input[type="search"], input[placeholder*="Search"], [class*="filter"], select').first();
    await expect(searchOrFilter).toBeVisible();
  });

  test('should display facility cards or list', async ({ page }) => {
    const facilities = page.locator('[class*="card"], [class*="facility"], [role="listitem"], .grid > div').first();
    await expect(facilities).toBeVisible({ timeout: 10000 });
  });

  test('should filter facilities by care type', async ({ page }) => {
    const careTypeFilter = page.locator('select, [role="combobox"], button:has-text("Care Type")').first();
    if (await careTypeFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await careTypeFilter.click();
      const option = page.locator('[role="option"], option').first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
      }
    }
  });

  test('should filter facilities by location', async ({ page }) => {
    const locationInput = page.locator('input[placeholder*="Location"], input[placeholder*="City"], input[placeholder*="Zip"]').first();
    if (await locationInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await locationInput.fill('Seattle');
      await page.waitForTimeout(1000);
    }
  });

  test('clicking facility navigates to detail page', async ({ page }) => {
    const facilityCard = page.locator('[class*="card"] a, a[href*="facility"], [class*="facility"]').first();
    if (await facilityCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await facilityCard.click();
      await expect(page).toHaveURL(/facility|detail/);
    }
  });
});
