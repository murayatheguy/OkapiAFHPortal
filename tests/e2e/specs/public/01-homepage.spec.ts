import { test, expect } from '@playwright/test';

test.describe('Public Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Okapi|AFH|Care/i);
  });

  test('should display hero section', async ({ page }) => {
    const hero = page.locator('h1, [class*="hero"]').first();
    await expect(hero).toBeVisible();
  });

  test('should have Find Care CTA button', async ({ page }) => {
    const ctaButton = page.locator('button:has-text("Find Care"), a:has-text("Find Care")').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should have login link', async ({ page }) => {
    const loginLink = page.locator('a:has-text("Login"), button:has-text("Login"), a:has-text("Owner")').first();
    await expect(loginLink).toBeVisible();
  });

  test('Find Care button navigates to wizard', async ({ page }) => {
    const ctaButton = page.locator('button:has-text("Find Care"), a:has-text("Find Care")').first();
    await ctaButton.click();
    await expect(page.locator('text=Care Type, text=What type, text=Search, text=Find')).toBeVisible({ timeout: 5000 });
  });

  test('Login link navigates to login page', async ({ page }) => {
    const loginLink = page.locator('a:has-text("Login"), button:has-text("Login"), a:has-text("Owner")').first();
    await loginLink.click();
    await expect(page).toHaveURL(/login/);
  });
});
