import { Page, expect } from '@playwright/test';
import { TestAccount } from '../fixtures/test-accounts';

export async function loginAsOwner(page: Page, account: TestAccount): Promise<void> {
  await page.goto('/login');
  await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

  await page.fill('input[type="email"], input[name="email"]', account.email);
  await page.fill('input[type="password"], input[name="password"]', account.password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/dashboard|owner/, { timeout: 15000 });
}

export async function logout(page: Page): Promise<void> {
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [aria-label="Logout"]');

  if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutButton.click();
  } else {
    const userMenu = page.locator('[aria-label="User menu"], button:has-text("Account")');
    if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenu.click();
      await page.click('text=Logout, text=Sign Out');
    }
  }

  await expect(page).toHaveURL(/login|\/$/);
}

export async function loginToCarePortal(page: Page, facilityPin: string): Promise<void> {
  await page.goto('/care-portal');
  await expect(page.locator('input[type="password"], input[name="pin"]')).toBeVisible();
  await page.fill('input[type="password"], input[name="pin"]', facilityPin);
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Residents, text=Care Portal')).toBeVisible({ timeout: 5000 });
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await expect(page.locator('text=Dashboard, text=Welcome, text=Logout')).toBeVisible({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

export async function ensureLoggedOut(page: Page): Promise<void> {
  await page.goto('/');
  if (await isLoggedIn(page)) {
    await logout(page);
  }
}
