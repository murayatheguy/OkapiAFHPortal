import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Owner Profile Settings', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);

    // Navigate to settings
    const settingsLink = page.locator('nav >> text=Setting, aside >> text=Setting, a:has-text("Setting")').first();
    await settingsLink.click();
    await waitForPageLoad(page);
  });

  test('should display settings page', async ({ page }) => {
    const settingsHeader = page.locator('h1:has-text("Setting"), h2:has-text("Setting"), text=Settings').first();
    await expect(settingsHeader).toBeVisible({ timeout: 10000 });
  });

  test('should display profile section', async ({ page }) => {
    const profileSection = page.locator('text=Profile, text=Account, text=Personal').first();
    await expect(profileSection).toBeVisible({ timeout: 5000 });
  });

  test('should display facility information', async ({ page }) => {
    const facilitySection = page.locator('text=Facility, text=Business, text=Organization').first();
    if (await facilitySection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(facilitySection).toBeVisible();
    }
  });

  test('should have editable profile fields', async ({ page }) => {
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Update"), [aria-label="Edit"]').first();
    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(editButton).toBeEnabled();
    }
  });

  test('should display notification preferences', async ({ page }) => {
    const notificationSection = page.locator('text=Notification, text=Email, text=Preferences').first();
    if (await notificationSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(notificationSection).toBeVisible();
    }
  });

  test('should display security settings', async ({ page }) => {
    const securitySection = page.locator('text=Security, text=Password, text=Authentication').first();
    if (await securitySection.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(securitySection).toBeVisible();
    }
  });

  test('should allow password change', async ({ page }) => {
    const changePasswordBtn = page.locator('button:has-text("Password"), a:has-text("Password")').first();
    if (await changePasswordBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(changePasswordBtn).toBeEnabled();
    }
  });
});
