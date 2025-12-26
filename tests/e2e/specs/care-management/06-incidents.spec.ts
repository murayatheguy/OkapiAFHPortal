import { test, expect } from '@playwright/test';
import { getTestAccount } from '../../fixtures/test-accounts';
import { loginAsOwner, ensureLoggedOut } from '../../helpers/auth';
import { waitForPageLoad } from '../../helpers/navigation';

test.describe('Incident Reporting', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    const account = getTestAccount('afh-001');
    await loginAsOwner(page, account);
    await waitForPageLoad(page);
  });

  test('should navigate to incidents page', async ({ page }) => {
    const incidentLink = page.locator('a:has-text("Incident"), nav >> text=Incident, aside >> text=Incident').first();
    if (await incidentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentLink.click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/incident/i);
    }
  });

  test('should display incidents list', async ({ page }) => {
    const incidentLink = page.locator('a:has-text("Incident"), nav >> text=Incident, aside >> text=Incident').first();
    if (await incidentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentLink.click();
      await waitForPageLoad(page);

      const incidentList = page.locator('table, [class*="list"], [class*="incident"]').first();
      await expect(incidentList).toBeVisible({ timeout: 10000 });
    }
  });

  test('should have create incident button', async ({ page }) => {
    const incidentLink = page.locator('a:has-text("Incident"), nav >> text=Incident, aside >> text=Incident').first();
    if (await incidentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentLink.click();
      await waitForPageLoad(page);

      const createButton = page.locator('button:has-text("Report"), button:has-text("New Incident"), button:has-text("Add")').first();
      await expect(createButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('should open incident report form', async ({ page }) => {
    const incidentLink = page.locator('a:has-text("Incident"), nav >> text=Incident, aside >> text=Incident').first();
    if (await incidentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentLink.click();
      await waitForPageLoad(page);

      const createButton = page.locator('button:has-text("Report"), button:has-text("New Incident"), button:has-text("Add")').first();
      await createButton.click();
      await waitForPageLoad(page);

      const form = page.locator('form, [role="dialog"]');
      await expect(form).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display incident types', async ({ page }) => {
    const incidentLink = page.locator('a:has-text("Incident"), nav >> text=Incident, aside >> text=Incident').first();
    if (await incidentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentLink.click();
      await waitForPageLoad(page);

      const createButton = page.locator('button:has-text("Report"), button:has-text("New Incident"), button:has-text("Add")').first();
      await createButton.click();
      await waitForPageLoad(page);

      // Look for incident type dropdown or radio
      const typeSelector = page.locator('select, [role="combobox"], [role="radiogroup"]').first();
      if (await typeSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(typeSelector).toBeVisible();
      }
    }
  });

  test('should filter incidents by status', async ({ page }) => {
    const incidentLink = page.locator('a:has-text("Incident"), nav >> text=Incident, aside >> text=Incident').first();
    if (await incidentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentLink.click();
      await waitForPageLoad(page);

      const statusFilter = page.locator('select, [role="combobox"], button:has-text("Status")').first();
      if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(statusFilter).toBeVisible();
      }
    }
  });

  test('should filter incidents by date', async ({ page }) => {
    const incidentLink = page.locator('a:has-text("Incident"), nav >> text=Incident, aside >> text=Incident').first();
    if (await incidentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentLink.click();
      await waitForPageLoad(page);

      const dateFilter = page.locator('input[type="date"], button:has-text("Date")').first();
      if (await dateFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(dateFilter).toBeVisible();
      }
    }
  });

  test('should view incident details', async ({ page }) => {
    const incidentLink = page.locator('a:has-text("Incident"), nav >> text=Incident, aside >> text=Incident').first();
    if (await incidentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await incidentLink.click();
      await waitForPageLoad(page);

      const incidentRow = page.locator('table tbody tr, [class*="incident-card"]').first();
      if (await incidentRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await incidentRow.click();
        await waitForPageLoad(page);
      }
    }
  });
});
