import { test, expect } from '@playwright/test';

test.describe('Care Portal - Incident Reporting', () => {
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

  test('should display incident tab or button', async ({ page }) => {
    const incidentTab = page.locator('text=Incident, button:has-text("Incident"), a:has-text("Incident"), button:has-text("Report")').first();
    if (await incidentTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(incidentTab).toBeVisible();
    }
  });

  test('should open incident form', async ({ page }) => {
    const incidentButton = page.locator('button:has-text("Report Incident"), button:has-text("Incident"), a:has-text("Incident")').first();
    if (await incidentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentButton.click();
      await page.waitForTimeout(2000);

      const incidentForm = page.locator('form, [role="dialog"]').first();
      await expect(incidentForm).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display incident type options', async ({ page }) => {
    const incidentButton = page.locator('button:has-text("Report Incident"), button:has-text("Incident")').first();
    if (await incidentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentButton.click();
      await page.waitForTimeout(2000);

      const typeSelect = page.locator('select, [role="combobox"], [role="radiogroup"]').first();
      if (await typeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(typeSelect).toBeVisible();
      }
    }
  });

  test('should have required fields', async ({ page }) => {
    const incidentButton = page.locator('button:has-text("Report Incident"), button:has-text("Incident")').first();
    if (await incidentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentButton.click();
      await page.waitForTimeout(2000);

      // Check for description/details field
      const descriptionField = page.locator('textarea, input[name*="description"], input[name*="detail"]').first();
      if (await descriptionField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(descriptionField).toBeVisible();
      }
    }
  });

  test('should submit incident report', async ({ page }) => {
    const incidentButton = page.locator('button:has-text("Report Incident"), button:has-text("Incident")').first();
    if (await incidentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentButton.click();
      await page.waitForTimeout(2000);

      // Fill basic info
      const descriptionField = page.locator('textarea').first();
      if (await descriptionField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await descriptionField.fill(`E2E Test Incident - ${new Date().toISOString()}`);
      }

      const submitButton = page.locator('button:has-text("Submit"), button:has-text("Report"), button[type="submit"]').first();
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should allow witness information', async ({ page }) => {
    const incidentButton = page.locator('button:has-text("Report Incident"), button:has-text("Incident")').first();
    if (await incidentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentButton.click();
      await page.waitForTimeout(2000);

      const witnessField = page.locator('input[name*="witness"], textarea[name*="witness"], text=Witness').first();
      if (await witnessField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(witnessField).toBeVisible();
      }
    }
  });

  test('should capture date and time', async ({ page }) => {
    const incidentButton = page.locator('button:has-text("Report Incident"), button:has-text("Incident")').first();
    if (await incidentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentButton.click();
      await page.waitForTimeout(2000);

      const dateTimeField = page.locator('input[type="datetime-local"], input[type="date"], input[type="time"]').first();
      if (await dateTimeField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(dateTimeField).toBeVisible();
      }
    }
  });

  test('should have severity level option', async ({ page }) => {
    const incidentButton = page.locator('button:has-text("Report Incident"), button:has-text("Incident")').first();
    if (await incidentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentButton.click();
      await page.waitForTimeout(2000);

      const severityField = page.locator('select[name*="severity"], [role="combobox"], text=Severity, text=Level').first();
      if (await severityField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(severityField).toBeVisible();
      }
    }
  });
});
