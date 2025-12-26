import { Page, expect } from '@playwright/test';

export async function fillField(page: Page, fieldIdentifier: string, value: string): Promise<void> {
  let field = page.locator(`label:has-text("${fieldIdentifier}") + input, label:has-text("${fieldIdentifier}") + textarea`);

  if (!await field.isVisible({ timeout: 1000 }).catch(() => false)) {
    field = page.locator(`input[name="${fieldIdentifier}"], input[placeholder*="${fieldIdentifier}"], textarea[name="${fieldIdentifier}"]`);
  }

  await field.fill(value);
}

export async function selectOption(page: Page, fieldIdentifier: string, value: string): Promise<void> {
  let select = page.locator(`select[name="${fieldIdentifier}"], label:has-text("${fieldIdentifier}") + select`);

  if (await select.isVisible({ timeout: 1000 }).catch(() => false)) {
    await select.selectOption(value);
  } else {
    const trigger = page.locator(`button:has-text("${fieldIdentifier}"), [role="combobox"]`).first();
    await trigger.click();
    await page.click(`[role="option"]:has-text("${value}")`);
  }
}

export async function setCheckbox(page: Page, label: string, checked: boolean): Promise<void> {
  const checkbox = page.locator(`label:has-text("${label}") input[type="checkbox"], input[type="checkbox"][name="${label}"]`);

  if (checked) {
    await checkbox.check();
  } else {
    await checkbox.uncheck();
  }
}

export async function fillDate(page: Page, fieldIdentifier: string, date: Date): Promise<void> {
  const dateString = date.toISOString().split('T')[0];
  const field = page.locator(`input[type="date"][name="${fieldIdentifier}"], label:has-text("${fieldIdentifier}") + input`);
  await field.fill(dateString);
}

export async function submitForm(page: Page): Promise<void> {
  const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Create")').first();
  await submitButton.click();
  await page.waitForLoadState('networkidle');
}

export async function expectSuccessMessage(page: Page): Promise<void> {
  const success = page.locator('text=Success, text=Created, text=Saved, text=Updated, [role="alert"]').first();
  await expect(success).toBeVisible({ timeout: 5000 });
}

export async function expectErrorMessage(page: Page, message?: string): Promise<void> {
  const errorIndicators = message
    ? [`text="${message}"`, `[role="alert"]:has-text("${message}")`]
    : ['text=Error', 'text=Failed', '[role="alert"]'];

  const error = page.locator(errorIndicators.join(', ')).first();
  await expect(error).toBeVisible({ timeout: 5000 });
}

export async function fillResidentForm(page: Page, data: {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  roomNumber: string;
}): Promise<void> {
  await fillField(page, 'firstName', data.firstName);
  await fillField(page, 'lastName', data.lastName);
  await fillDate(page, 'dateOfBirth', data.dateOfBirth);
  await selectOption(page, 'gender', data.gender);
  await fillField(page, 'roomNumber', data.roomNumber);
}

export async function fillStaffForm(page: Page, data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}): Promise<void> {
  await fillField(page, 'firstName', data.firstName);
  await fillField(page, 'lastName', data.lastName);
  await fillField(page, 'email', data.email);
  await fillField(page, 'phone', data.phone);
  await selectOption(page, 'role', data.role);
}
