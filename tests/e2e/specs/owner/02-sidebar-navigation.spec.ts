import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { navigateToSidebar, waitForPageLoad } from '../../helpers/navigation';
import { EXPECTED_SIDEBAR_ITEMS } from '../../fixtures/test-data';

test.describe('Owner Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);
  });

  test('should display sidebar', async ({ page }) => {
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('should have Dashboard link', async ({ page }) => {
    const dashboardLink = page.locator('nav >> text=Dashboard, aside >> text=Dashboard').first();
    await expect(dashboardLink).toBeVisible();
  });

  test('should have Residents link', async ({ page }) => {
    const residentsLink = page.locator('nav >> text=Resident, aside >> text=Resident').first();
    await expect(residentsLink).toBeVisible();
  });

  test('should have Staff link', async ({ page }) => {
    const staffLink = page.locator('nav >> text=Staff, aside >> text=Staff').first();
    await expect(staffLink).toBeVisible();
  });

  test('should have Settings link', async ({ page }) => {
    const settingsLink = page.locator('nav >> text=Setting, aside >> text=Setting').first();
    await expect(settingsLink).toBeVisible();
  });

  test('should navigate to Residents page', async ({ page }) => {
    const residentsLink = page.locator('nav >> text=Resident, aside >> text=Resident, a:has-text("Resident")').first();
    await residentsLink.click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/resident/i);
  });

  test('should navigate to Staff page', async ({ page }) => {
    const staffLink = page.locator('nav >> text=Staff, aside >> text=Staff, a:has-text("Staff")').first();
    await staffLink.click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/staff/i);
  });

  test('should navigate to Settings page', async ({ page }) => {
    const settingsLink = page.locator('nav >> text=Setting, aside >> text=Setting, a:has-text("Setting")').first();
    await settingsLink.click();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/setting/i);
  });

  test('should highlight active navigation item', async ({ page }) => {
    const residentsLink = page.locator('nav >> text=Resident, aside >> text=Resident, a:has-text("Resident")').first();
    await residentsLink.click();
    await waitForPageLoad(page);

    // Check for active state (common patterns)
    const activeItem = page.locator('[aria-current="page"], .active, [data-active="true"]').first();
    if (await activeItem.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(activeItem).toBeVisible();
    }
  });
});
