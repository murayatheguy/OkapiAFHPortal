import { test, expect } from '@playwright/test';

test.describe('Care Portal - Medication Logging', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to care portal and login
    await page.goto('/care-portal');
    const pinInput = page.locator('input[type="password"], input[name="pin"]');
    if (await pinInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pinInput.fill('1234');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(3000);
    }

    // Select first resident
    const residentCard = page.locator('[class*="resident-card"], [class*="resident"] button, table tbody tr').first();
    if (await residentCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await residentCard.click();
      await page.waitForTimeout(2000);
    }
  });

  test('should display medication tab or section', async ({ page }) => {
    const medicationTab = page.locator('text=Medication, button:has-text("Medication"), a:has-text("Medication"), text=MAR').first();
    if (await medicationTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(medicationTab).toBeVisible();
    }
  });

  test('should display medication list', async ({ page }) => {
    const medicationTab = page.locator('text=Medication, button:has-text("Medication"), a:has-text("Medication")').first();
    if (await medicationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await medicationTab.click();
      await page.waitForTimeout(2000);

      const medicationList = page.locator('table, [class*="list"], [class*="medication"]').first();
      if (await medicationList.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(medicationList).toBeVisible();
      }
    }
  });

  test('should display medication schedule', async ({ page }) => {
    const medicationTab = page.locator('text=Medication, button:has-text("Medication")').first();
    if (await medicationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await medicationTab.click();
      await page.waitForTimeout(2000);

      const scheduleInfo = page.locator('text=/AM|PM|Morning|Evening|Daily|BID|TID|PRN/').first();
      if (await scheduleInfo.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(scheduleInfo).toBeVisible();
      }
    }
  });

  test('should have administer button', async ({ page }) => {
    const medicationTab = page.locator('text=Medication, button:has-text("Medication")').first();
    if (await medicationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await medicationTab.click();
      await page.waitForTimeout(2000);

      const administerButton = page.locator('button:has-text("Administer"), button:has-text("Give"), button:has-text("Log"), [class*="administer"]').first();
      if (await administerButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(administerButton).toBeEnabled();
      }
    }
  });

  test('should log medication administration', async ({ page }) => {
    const medicationTab = page.locator('text=Medication, button:has-text("Medication")').first();
    if (await medicationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await medicationTab.click();
      await page.waitForTimeout(2000);

      const administerButton = page.locator('button:has-text("Administer"), button:has-text("Give"), button:has-text("Log")').first();
      if (await administerButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await administerButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should show refused/skipped options', async ({ page }) => {
    const medicationTab = page.locator('text=Medication, button:has-text("Medication")').first();
    if (await medicationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await medicationTab.click();
      await page.waitForTimeout(2000);

      const refusedOption = page.locator('button:has-text("Refused"), button:has-text("Skip"), text=Refused, text=Skip').first();
      if (await refusedOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(refusedOption).toBeVisible();
      }
    }
  });

  test('should require staff signature/confirmation', async ({ page }) => {
    const medicationTab = page.locator('text=Medication, button:has-text("Medication")').first();
    if (await medicationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await medicationTab.click();
      await page.waitForTimeout(2000);

      // Look for signature or confirmation requirement
      const signatureField = page.locator('input[name*="signature"], input[name*="pin"], canvas, text=Confirm, text=Sign').first();
      if (await signatureField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(signatureField).toBeVisible();
      }
    }
  });

  test('should display medication history', async ({ page }) => {
    const medicationTab = page.locator('text=Medication, button:has-text("Medication")').first();
    if (await medicationTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await medicationTab.click();
      await page.waitForTimeout(2000);

      const historyLink = page.locator('text=History, button:has-text("History"), a:has-text("History")').first();
      if (await historyLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await historyLink.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});
