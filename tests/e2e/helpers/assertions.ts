import { Page, expect } from '@playwright/test';

export async function assertVisible(page: Page, text: string): Promise<void> {
  await expect(page.locator(`text="${text}"`).first()).toBeVisible();
}

export async function assertNotVisible(page: Page, text: string): Promise<void> {
  await expect(page.locator(`text="${text}"`)).toBeHidden();
}

export async function assertUrlContains(page: Page, pattern: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(pattern));
}

export async function assertTableRowCount(page: Page, expectedCount: number): Promise<void> {
  const rows = page.locator('table tbody tr, [role="row"]');
  await expect(rows).toHaveCount(expectedCount);
}

export async function assertTableContains(page: Page, text: string): Promise<void> {
  const table = page.locator('table, [role="table"]');
  await expect(table).toContainText(text);
}

export async function assertFieldValue(page: Page, fieldName: string, expectedValue: string): Promise<void> {
  const field = page.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
  await expect(field).toHaveValue(expectedValue);
}

export async function assertButtonEnabled(page: Page, buttonText: string, enabled: boolean = true): Promise<void> {
  const button = page.locator(`button:has-text("${buttonText}")`).first();
  if (enabled) {
    await expect(button).toBeEnabled();
  } else {
    await expect(button).toBeDisabled();
  }
}

export async function assertNotLoading(page: Page): Promise<void> {
  const loadingIndicators = page.locator('.animate-spin, [role="progressbar"], text="Loading"');
  await expect(loadingIndicators).toBeHidden({ timeout: 10000 });
}

export async function assertModalOpen(page: Page, title?: string): Promise<void> {
  const modal = page.locator('[role="dialog"], [role="alertdialog"], .modal');
  await expect(modal).toBeVisible();

  if (title) {
    await expect(modal).toContainText(title);
  }
}

export async function assertModalClosed(page: Page): Promise<void> {
  const modal = page.locator('[role="dialog"], [role="alertdialog"], .modal');
  await expect(modal).toBeHidden();
}

export async function assertToast(page: Page, type: 'success' | 'error' | 'info', message?: string): Promise<void> {
  const toastSelectors = {
    success: '[data-sonner-toast][data-type="success"], [class*="toast"]:has-text("success")',
    error: '[data-sonner-toast][data-type="error"], [class*="toast"]:has-text("error")',
    info: '[data-sonner-toast][data-type="info"], [class*="toast"]:has-text("info")',
  };

  const toast = page.locator(toastSelectors[type]).first();
  await expect(toast).toBeVisible({ timeout: 5000 });

  if (message) {
    await expect(toast).toContainText(message);
  }
}

export async function takeDebugScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `tests/e2e/reports/screenshots/${name}.png`, fullPage: true });
}
