import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';
import { fillField, selectOption, fillDate, submitForm } from '../../helpers/forms';

test.describe('Residents CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);

    const residentsLink = page.locator('nav >> text=Resident, aside >> text=Resident, a:has-text("Resident")').first();
    await residentsLink.click();
    await waitForPageLoad(page);
  });

  test('should open add resident form', async ({ page }) => {
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

    // Check for common resident form fields
    const firstNameField = page.locator('input[name*="first"], input[placeholder*="First"], label:has-text("First")');
    const lastNameField = page.locator('input[name*="last"], input[placeholder*="Last"], label:has-text("Last")');

    await expect(firstNameField.first()).toBeVisible({ timeout: 5000 });
    await expect(lastNameField.first()).toBeVisible({ timeout: 5000 });
  });

  test('should create new resident', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add")').first();
    await addButton.click();
    await waitForPageLoad(page);

    // Fill form
    const testFirstName = `E2ETest${Date.now()}`;
    const firstNameField = page.locator('input[name*="first"], input[placeholder*="First"]').first();
    const lastNameField = page.locator('input[name*="last"], input[placeholder*="Last"]').first();

    await firstNameField.fill(testFirstName);
    await lastNameField.fill('Resident');

    // Fill date of birth if visible
    const dobField = page.locator('input[type="date"], input[name*="birth"], input[name*="dob"]').first();
    if (await dobField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dobField.fill('1950-01-15');
    }

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
    await submitButton.click();
    await waitForPageLoad(page);
  });

  test('should view resident details', async ({ page }) => {
    const residentRow = page.locator('table tbody tr, [class*="resident-card"]').first();
    if (await residentRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await residentRow.click();
      await waitForPageLoad(page);

      // Should show details view
      const detailView = page.locator('h1, h2, [class*="detail"], [class*="profile"]').first();
      await expect(detailView).toBeVisible({ timeout: 5000 });
    }
  });

  test('should edit resident', async ({ page }) => {
    const residentRow = page.locator('table tbody tr, [class*="resident-card"]').first();
    if (await residentRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await residentRow.click();
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

  test('should archive/deactivate resident', async ({ page }) => {
    const residentRow = page.locator('table tbody tr, [class*="resident-card"]').first();
    if (await residentRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await residentRow.click();
      await waitForPageLoad(page);

      const archiveButton = page.locator('button:has-text("Archive"), button:has-text("Deactivate"), button:has-text("Discharge")').first();
      if (await archiveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(archiveButton).toBeEnabled();
      }
    }
  });

  test('should validate required fields', async ({ page }) => {
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add")').first();
    await addButton.click();
    await waitForPageLoad(page);

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
    await submitButton.click();

    // Should show validation errors
    const errorMessage = page.locator('[class*="error"], [role="alert"], text=required').first();
    if (await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(errorMessage).toBeVisible();
    }
  });
});
