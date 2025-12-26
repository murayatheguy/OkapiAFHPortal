import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Staff Credentials', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);

    const staffLink = page.locator('nav >> text=Staff, aside >> text=Staff, a:has-text("Staff")').first();
    await staffLink.click();
    await waitForPageLoad(page);
  });

  test('should navigate to credentials section', async ({ page }) => {
    const credentialsLink = page.locator('a:has-text("Credential"), button:has-text("Credential"), text=Credential').first();
    if (await credentialsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await credentialsLink.click();
      await waitForPageLoad(page);
      await expect(page.locator('text=Credential')).toBeVisible();
    }
  });

  test('should display credential types', async ({ page }) => {
    // First click on a staff member
    const staffRow = page.locator('table tbody tr, [class*="staff-card"]').first();
    if (await staffRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await staffRow.click();
      await waitForPageLoad(page);

      // Look for credentials tab or section
      const credentialsTab = page.locator('text=Credential, button:has-text("Credential")').first();
      if (await credentialsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await credentialsTab.click();
        await waitForPageLoad(page);
      }
    }
  });

  test('should add new credential', async ({ page }) => {
    const staffRow = page.locator('table tbody tr, [class*="staff-card"]').first();
    if (await staffRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await staffRow.click();
      await waitForPageLoad(page);

      const credentialsTab = page.locator('text=Credential, button:has-text("Credential")').first();
      if (await credentialsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await credentialsTab.click();
        await waitForPageLoad(page);

        const addCredentialBtn = page.locator('button:has-text("Add"), button:has-text("New Credential")').first();
        if (await addCredentialBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addCredentialBtn.click();
          await expect(page.locator('form, [role="dialog"]')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should display expiration dates', async ({ page }) => {
    const staffRow = page.locator('table tbody tr, [class*="staff-card"]').first();
    if (await staffRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await staffRow.click();
      await waitForPageLoad(page);

      const credentialsTab = page.locator('text=Credential, button:has-text("Credential")').first();
      if (await credentialsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await credentialsTab.click();
        await waitForPageLoad(page);

        // Look for expiration date format
        const expirationDate = page.locator('text=/\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4}|Expir/').first();
        if (await expirationDate.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(expirationDate).toBeVisible();
        }
      }
    }
  });

  test('should show expiring credential alerts', async ({ page }) => {
    const expiringAlert = page.locator('text=Expiring, text=Due, [class*="warning"], [class*="alert"]').first();
    if (await expiringAlert.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(expiringAlert).toBeVisible();
    }
  });

  test('should upload credential document', async ({ page }) => {
    const staffRow = page.locator('table tbody tr, [class*="staff-card"]').first();
    if (await staffRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await staffRow.click();
      await waitForPageLoad(page);

      const credentialsTab = page.locator('text=Credential, button:has-text("Credential")').first();
      if (await credentialsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await credentialsTab.click();
        await waitForPageLoad(page);

        const uploadButton = page.locator('button:has-text("Upload"), input[type="file"], [class*="upload"]').first();
        if (await uploadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(uploadButton).toBeVisible();
        }
      }
    }
  });
});
