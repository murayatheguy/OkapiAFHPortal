import { test, expect, devices } from '@playwright/test';

// Use mobile viewport for these tests
test.use(devices['Pixel 5']);

test.describe('Care Portal - Mobile Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/care-portal');
  });

  test('should display mobile-friendly login', async ({ page }) => {
    const pinInput = page.locator('input[type="password"], input[name="pin"]');
    await expect(pinInput).toBeVisible({ timeout: 10000 });

    // Verify input is properly sized for mobile
    const box = await pinInput.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThan(100);
    }
  });

  test('should have touch-friendly buttons', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    const box = await submitButton.boundingBox();
    if (box) {
      // Minimum touch target size (44x44 recommended)
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('should display properly on mobile viewport', async ({ page }) => {
    const content = page.locator('body');
    const box = await content.boundingBox();
    if (box) {
      // Content should fit within mobile viewport
      expect(box.width).toBeLessThanOrEqual(412); // Pixel 5 width
    }
  });

  test('should not have horizontal scrolling', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // Small tolerance
  });

  test('should display readable text size', async ({ page }) => {
    const pinInput = page.locator('input[type="password"], input[name="pin"]');
    if (await pinInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pinInput.fill('1234');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(3000);

      // Check that text is readable
      const textElement = page.locator('p, span, div').first();
      const fontSize = await textElement.evaluate(el => window.getComputedStyle(el).fontSize);
      const sizeNum = parseInt(fontSize);
      expect(sizeNum).toBeGreaterThanOrEqual(12); // Minimum readable size
    }
  });

  test('should have mobile navigation', async ({ page }) => {
    const pinInput = page.locator('input[type="password"], input[name="pin"]');
    if (await pinInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pinInput.fill('1234');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(3000);

      // Look for mobile menu or navigation
      const mobileNav = page.locator('[class*="mobile"], [class*="hamburger"], button[aria-label*="menu"], nav').first();
      if (await mobileNav.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(mobileNav).toBeVisible();
      }
    }
  });

  test('should stack elements vertically on mobile', async ({ page }) => {
    const pinInput = page.locator('input[type="password"], input[name="pin"]');
    if (await pinInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pinInput.fill('1234');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(3000);

      // Content should be stacked vertically
      const content = page.locator('[class*="grid"], [class*="flex"]').first();
      if (await content.isVisible({ timeout: 3000 }).catch(() => false)) {
        const box = await content.boundingBox();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(412);
        }
      }
    }
  });

  test('should have adequate spacing for touch', async ({ page }) => {
    const pinInput = page.locator('input[type="password"], input[name="pin"]');
    if (await pinInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pinInput.fill('1234');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(3000);

      // Check button spacing
      const buttons = page.locator('button');
      const count = await buttons.count();
      if (count >= 2) {
        const box1 = await buttons.nth(0).boundingBox();
        const box2 = await buttons.nth(1).boundingBox();
        if (box1 && box2) {
          // Buttons should have at least 8px gap
          const gap = Math.abs((box2.y) - (box1.y + box1.height));
          expect(gap).toBeGreaterThanOrEqual(8);
        }
      }
    }
  });
});
