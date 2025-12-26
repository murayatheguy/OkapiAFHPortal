import { Page, expect } from '@playwright/test';

export async function navigateToSidebar(page: Page, itemText: string): Promise<void> {
  const sidebarItem = page.locator(`nav >> text="${itemText}", aside >> text="${itemText}"`).first();
  await sidebarItem.click();
  await page.waitForLoadState('networkidle');
}

export async function navigateToCareManagement(page: Page, section?: string): Promise<void> {
  await navigateToSidebar(page, 'Care Management');

  if (section) {
    const sectionElement = page.locator(`text="${section}"`).first();
    await sectionElement.click();
    await page.waitForLoadState('networkidle');
  }
}

export async function navigateToSettings(page: Page, section?: string): Promise<void> {
  await navigateToSidebar(page, 'Settings');

  if (section) {
    const sectionElement = page.locator(`text="${section}"`).first();
    await sectionElement.click();
    await page.waitForLoadState('networkidle');
  }
}

export async function goBack(page: Page): Promise<void> {
  const backButton = page.locator('button:has-text("Back"), [aria-label="Back"]').first();
  await backButton.click();
  await page.waitForLoadState('networkidle');
}

export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  const spinner = page.locator('.animate-spin, [role="progressbar"]');
  if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await expect(spinner).toBeHidden({ timeout: 10000 });
  }
}

export async function getPageHeader(page: Page): Promise<string> {
  const header = page.locator('h1, [role="heading"]').first();
  return await header.textContent() || '';
}
