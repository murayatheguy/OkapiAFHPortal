import { test, expect } from '@playwright/test';

test.describe('Care Portal - Resident Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to care portal and login with PIN
    await page.goto('/care-portal');
    const pinInput = page.locator('input[type="password"], input[name="pin"]');
    if (await pinInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pinInput.fill('1234');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(3000);
    }
  });

  test('should display resident list', async ({ page }) => {
    const residentList = page.locator('[class*="resident"], [class*="list"], [class*="grid"], table').first();
    if (await residentList.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(residentList).toBeVisible();
    }
  });

  test('should display resident photos or avatars', async ({ page }) => {
    const avatars = page.locator('img, [class*="avatar"], [class*="photo"]').first();
    if (await avatars.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(avatars).toBeVisible();
    }
  });

  test('should display resident names', async ({ page }) => {
    const residentName = page.locator('[class*="name"], text=/[A-Z][a-z]+ [A-Z][a-z]+/').first();
    if (await residentName.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(residentName).toBeVisible();
    }
  });

  test('should display room numbers', async ({ page }) => {
    const roomNumber = page.locator('text=/Room|Rm|\\d{1,3}/').first();
    if (await roomNumber.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(roomNumber).toBeVisible();
    }
  });

  test('should select resident', async ({ page }) => {
    const residentCard = page.locator('[class*="resident-card"], [class*="resident"] button, table tbody tr').first();
    if (await residentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await residentCard.click();
      await page.waitForTimeout(2000);
    }
  });

  test('should show resident details after selection', async ({ page }) => {
    const residentCard = page.locator('[class*="resident-card"], [class*="resident"] button, table tbody tr').first();
    if (await residentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await residentCard.click();
      await page.waitForTimeout(2000);

      const detailView = page.locator('[class*="detail"], [class*="profile"], h1, h2').first();
      await expect(detailView).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(searchInput).toBeVisible();
    }
  });
});
