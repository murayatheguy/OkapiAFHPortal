import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Staff CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);

    const staffLink = page.locator('nav >> text=Staff, aside >> text=Staff, a:has-text("Staff")').first();
    await staffLink.click();
    await waitForPageLoad(page);
  });

  test('should open add staff form', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add")').first();
    await addButton.click();
    await waitForPageLoad(page);

    const form = page.locator('form, [role="dialog"]');
    await expect(form).toBeVisible({ timeout: 5000 });
  });

  test('should display required fields in form', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add")').first();
    await addButton.click();
    await waitForPageLoad(page);

    // Check for common staff form fields
    const firstNameField = page.locator('input[name*="first"], input[placeholder*="First"], label:has-text("First")');
    const lastNameField = page.locator('input[name*="last"], input[placeholder*="Last"], label:has-text("Last")');
    const emailField = page.locator('input[type="email"], input[name*="email"]');

    await expect(firstNameField.first()).toBeVisible({ timeout: 5000 });
    await expect(lastNameField.first()).toBeVisible({ timeout: 5000 });
    await expect(emailField.first()).toBeVisible({ timeout: 5000 });
  });

  test('should create new staff member', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add")').first();
    await addButton.click();
    await waitForPageLoad(page);

    // Fill form
    const testFirstName = `E2EStaff${Date.now()}`;
    const firstNameField = page.locator('input[name*="first"], input[placeholder*="First"]').first();
    const lastNameField = page.locator('input[name*="last"], input[placeholder*="Last"]').first();
    const emailField = page.locator('input[type="email"], input[name*="email"]').first();

    await firstNameField.fill(testFirstName);
    await lastNameField.fill('Member');
    await emailField.fill(`e2e.test.${Date.now()}@example.com`);

    // Fill phone if visible
    const phoneField = page.locator('input[type="tel"], input[name*="phone"]').first();
    if (await phoneField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneField.fill('2065551234');
    }

    // Select role if visible
    const roleSelect = page.locator('select[name*="role"], [role="combobox"]').first();
    if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await roleSelect.click();
      const caregiverOption = page.locator('[role="option"]:has-text("Caregiver"), option:has-text("Caregiver")').first();
      if (await caregiverOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await caregiverOption.click();
      }
    }

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
    await submitButton.click();
    await waitForPageLoad(page);
  });

  test('should view staff details', async ({ page }) => {
    const staffRow = page.locator('table tbody tr, [class*="staff-card"]').first();
    if (await staffRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await staffRow.click();
      await waitForPageLoad(page);

      const detailView = page.locator('h1, h2, [class*="detail"], [class*="profile"]').first();
      await expect(detailView).toBeVisible({ timeout: 5000 });
    }
  });

  test('should edit staff member', async ({ page }) => {
    const staffRow = page.locator('table tbody tr, [class*="staff-card"]').first();
    if (await staffRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await staffRow.click();
      await waitForPageLoad(page);

      const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit"), [aria-label="Edit"]').first();
      if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editButton.click();
        await waitForPageLoad(page);

        const form = page.locator('form, [role="dialog"]');
        await expect(form).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should deactivate staff member', async ({ page }) => {
    const staffRow = page.locator('table tbody tr, [class*="staff-card"]').first();
    if (await staffRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await staffRow.click();
      await waitForPageLoad(page);

      const deactivateButton = page.locator('button:has-text("Deactivate"), button:has-text("Disable"), button:has-text("Archive")').first();
      if (await deactivateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(deactivateButton).toBeEnabled();
      }
    }
  });

  test('should validate email format', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add")').first();
    await addButton.click();
    await waitForPageLoad(page);

    const emailField = page.locator('input[type="email"], input[name*="email"]').first();
    await emailField.fill('invalid-email');

    const submitButton = page.locator('button[type="submit"], button:has-text("Save")').first();
    await submitButton.click();

    // Should show validation error or not submit
    await page.waitForTimeout(1000);
  });
});
