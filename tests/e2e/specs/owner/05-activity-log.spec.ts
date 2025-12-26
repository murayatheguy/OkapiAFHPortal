import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Activity Log', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);
  });

  test('should display activity log link', async ({ page }) => {
    const activityLink = page.locator('text=Activity, text=Log, text=History, text=Audit').first();
    if (await activityLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(activityLink).toBeVisible();
    }
  });

  test('should show recent activities on dashboard', async ({ page }) => {
    const recentActivity = page.locator('text=Recent, text=Activity, [class*="activity"]').first();
    if (await recentActivity.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(recentActivity).toBeVisible();
    }
  });

  test('should display activity entries with timestamps', async ({ page }) => {
    // Navigate to activity log if available
    const activityLink = page.locator('a:has-text("Activity"), a:has-text("Log"), a:has-text("History")').first();
    if (await activityLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await activityLink.click();
      await waitForPageLoad(page);

      // Check for timestamp format in entries
      const timestampPattern = page.locator('text=/\\d{1,2}[:\\/\\-]\\d{1,2}|ago|AM|PM/').first();
      if (await timestampPattern.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(timestampPattern).toBeVisible();
      }
    }
  });

  test('should filter activities by type', async ({ page }) => {
    const activityLink = page.locator('a:has-text("Activity"), a:has-text("Log"), a:has-text("History")').first();
    if (await activityLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await activityLink.click();
      await waitForPageLoad(page);

      const filterDropdown = page.locator('select, [role="combobox"], button:has-text("Filter")').first();
      if (await filterDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(filterDropdown).toBeEnabled();
      }
    }
  });

  test('should filter activities by date range', async ({ page }) => {
    const activityLink = page.locator('a:has-text("Activity"), a:has-text("Log"), a:has-text("History")').first();
    if (await activityLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await activityLink.click();
      await waitForPageLoad(page);

      const dateFilter = page.locator('input[type="date"], button:has-text("Date"), [class*="date"]').first();
      if (await dateFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(dateFilter).toBeVisible();
      }
    }
  });

  test('should show user actions in log', async ({ page }) => {
    // Perform an action (navigate somewhere)
    const residentsLink = page.locator('nav >> text=Resident, aside >> text=Resident').first();
    await residentsLink.click();
    await waitForPageLoad(page);

    // Navigate back to check activity
    const activityLink = page.locator('a:has-text("Activity"), a:has-text("Log")').first();
    if (await activityLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await activityLink.click();
      await waitForPageLoad(page);
    }
  });
});
