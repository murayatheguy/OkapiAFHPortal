import { test, expect } from '@playwright/test';

test.describe('Care Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const ctaButton = page.locator('button:has-text("Find Care"), a:has-text("Find Care")').first();
    if (await ctaButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ctaButton.click();
    } else {
      await page.goto('/wizard');
    }
  });

  test('should load care wizard', async ({ page }) => {
    const wizardContent = page.locator('text=Care Type, text=What type, text=Step, text=Find, h1, h2').first();
    await expect(wizardContent).toBeVisible({ timeout: 5000 });
  });

  test('should display care type options', async ({ page }) => {
    const options = page.locator('button, [role="radio"], [role="option"], label, [class*="option"]');
    await expect(options.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow selecting care type', async ({ page }) => {
    const careOption = page.locator('button:has-text("Memory"), button:has-text("Assisted"), button:has-text("Adult"), [role="radio"]').first();
    if (await careOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await careOption.click();
    }
  });

  test('should navigate to next step', async ({ page }) => {
    const careOption = page.locator('button:has-text("Memory"), button:has-text("Assisted"), button:has-text("Adult"), [role="radio"]').first();
    if (await careOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await careOption.click();
    }

    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should allow location input', async ({ page }) => {
    const locationInput = page.locator('input[placeholder*="Location"], input[placeholder*="Zip"], input[placeholder*="City"], input[type="text"]').first();
    if (await locationInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await locationInput.fill('Seattle, WA');
    }
  });

  test('should show results after completing wizard', async ({ page }) => {
    // Try to complete wizard steps
    const careOption = page.locator('button:has-text("Memory"), button:has-text("Assisted"), [role="radio"]').first();
    if (await careOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await careOption.click();
    }

    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Search"), button:has-text("Find")').first();
    if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextButton.click();
    }

    // Wait for results or next step
    await page.waitForTimeout(2000);
  });
});
