import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, logout, isLoggedIn, ensureLoggedOut } from '../../helpers/auth';

test.describe('Owner Logout', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
  });

  test('should logout successfully', async ({ page }) => {
    await logout(page);
    await expect(page).toHaveURL(/login|\//);
  });

  test('should redirect to login when accessing protected route after logout', async ({ page }) => {
    await logout(page);

    await page.goto('/owner/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('should clear session on logout', async ({ page }) => {
    await logout(page);

    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(false);
  });

  test('should not access dashboard after logout', async ({ page }) => {
    await logout(page);

    await page.goto('/owner');
    await expect(page).toHaveURL(/login/);
  });
});
