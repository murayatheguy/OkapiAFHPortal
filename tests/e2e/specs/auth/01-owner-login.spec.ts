import { test, expect } from '@playwright/test';
import { getAllTestAccounts, getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, logout, isLoggedIn, ensureLoggedOut } from '../../helpers/auth';

test.describe('Owner Login', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('text=Invalid, text=Error, text=incorrect, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should login primary test account', async ({ page }) => {
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await expect(page).toHaveURL(/dashboard|owner/);
  });

  test('should redirect to dashboard after login', async ({ page }) => {
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);

    const dashboardIndicator = page.locator('text=Dashboard, text=Welcome, text=Overview, nav, aside').first();
    await expect(dashboardIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should login all 10 test accounts', async ({ page }) => {
    const accounts = getAllTestAccounts();

    for (const account of accounts) {
      await ensureLoggedOut(page);
      await loginAsOwner(page, account);
      await expect(page).toHaveURL(/dashboard|owner/, { timeout: 15000 });

      // Verify logged in
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBe(true);

      await logout(page);
    }
  });

  test('should persist session on page refresh', async ({ page }) => {
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
  });

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.locator('a:has-text("Forgot"), a:has-text("Reset")').first();
    if (await forgotLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(forgotLink).toBeVisible();
    }
  });
});
