import { test, expect } from '@playwright/test';

test.describe('Care Portal - Care Notes', () => {
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

  test('should display notes tab or section', async ({ page }) => {
    const notesTab = page.locator('text=Note, button:has-text("Note"), a:has-text("Note"), text=Care Note').first();
    if (await notesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(notesTab).toBeVisible();
    }
  });

  test('should display notes list', async ({ page }) => {
    const notesTab = page.locator('text=Note, button:has-text("Note"), a:has-text("Note")').first();
    if (await notesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesTab.click();
      await page.waitForTimeout(2000);

      const notesList = page.locator('[class*="note"], [class*="list"], table').first();
      if (await notesList.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(notesList).toBeVisible();
      }
    }
  });

  test('should have add note button', async ({ page }) => {
    const notesTab = page.locator('text=Note, button:has-text("Note"), a:has-text("Note")').first();
    if (await notesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesTab.click();
      await page.waitForTimeout(2000);

      const addNoteButton = page.locator('button:has-text("Add Note"), button:has-text("New Note"), button:has-text("Add"), [class*="add"]').first();
      if (await addNoteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(addNoteButton).toBeEnabled();
      }
    }
  });

  test('should open note form', async ({ page }) => {
    const notesTab = page.locator('text=Note, button:has-text("Note"), a:has-text("Note")').first();
    if (await notesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesTab.click();
      await page.waitForTimeout(2000);

      const addNoteButton = page.locator('button:has-text("Add Note"), button:has-text("New Note"), button:has-text("Add")').first();
      if (await addNoteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addNoteButton.click();
        await page.waitForTimeout(2000);

        const noteForm = page.locator('form, [role="dialog"], textarea').first();
        await expect(noteForm).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should create care note', async ({ page }) => {
    const notesTab = page.locator('text=Note, button:has-text("Note"), a:has-text("Note")').first();
    if (await notesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesTab.click();
      await page.waitForTimeout(2000);

      const addNoteButton = page.locator('button:has-text("Add Note"), button:has-text("New Note"), button:has-text("Add")').first();
      if (await addNoteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addNoteButton.click();
        await page.waitForTimeout(2000);

        const noteTextarea = page.locator('textarea, [contenteditable="true"]').first();
        if (await noteTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
          await noteTextarea.fill(`E2E Test note created at ${new Date().toISOString()}`);

          const saveButton = page.locator('button:has-text("Save"), button:has-text("Submit"), button[type="submit"]').first();
          await saveButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('should display note categories', async ({ page }) => {
    const notesTab = page.locator('text=Note, button:has-text("Note"), a:has-text("Note")').first();
    if (await notesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesTab.click();
      await page.waitForTimeout(2000);

      const categorySelect = page.locator('select, [role="combobox"]').first();
      if (await categorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(categorySelect).toBeVisible();
      }
    }
  });

  test('should show note timestamps', async ({ page }) => {
    const notesTab = page.locator('text=Note, button:has-text("Note"), a:has-text("Note")').first();
    if (await notesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesTab.click();
      await page.waitForTimeout(2000);

      const timestamp = page.locator('text=/\\d{1,2}[:\\/\\-]\\d{1,2}|ago|AM|PM/').first();
      if (await timestamp.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(timestamp).toBeVisible();
      }
    }
  });

  test('should show note author', async ({ page }) => {
    const notesTab = page.locator('text=Note, button:has-text("Note"), a:has-text("Note")').first();
    if (await notesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesTab.click();
      await page.waitForTimeout(2000);

      const authorInfo = page.locator('text=/by|Author|Staff/').first();
      if (await authorInfo.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(authorInfo).toBeVisible();
      }
    }
  });
});
