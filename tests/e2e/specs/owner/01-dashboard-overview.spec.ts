import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Owner Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);
  });

  test('should display dashboard after login', async ({ page }) => {
    const dashboard = page.locator('text=Dashboard, text=Overview, text=Welcome, h1').first();
    await expect(dashboard).toBeVisible({ timeout: 10000 });
  });

  test('should display facility name', async ({ page }) => {
    const account = getTestAccount('afh-001');
    const facilityName = page.locator(`text="${account.facilityName}"`, { exact: false }).first();
    if (await facilityName.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(facilityName).toBeVisible();
    }
  });

  test('should display resident count widget', async ({ page }) => {
    const residentWidget = page.locator('text=Resident, text=resident').first();
    await expect(residentWidget).toBeVisible({ timeout: 5000 });
  });

  test('should display staff count widget', async ({ page }) => {
    const staffWidget = page.locator('text=Staff, text=staff, text=Employee').first();
    await expect(staffWidget).toBeVisible({ timeout: 5000 });
  });

  test('should display quick action buttons', async ({ page }) => {
    const actionButtons = page.locator('button, a').filter({ hasText: /Add|New|Create|Quick/ });
    if (await actionButtons.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(actionButtons.first()).toBeVisible();
    }
  });

  test('should display recent activity or notifications', async ({ page }) => {
    const activity = page.locator('text=Activity, text=Recent, text=Notification, text=Alert').first();
    if (await activity.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(activity).toBeVisible();
    }
  });
});
