import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Helper to load a theme via drag and drop
async function loadThemeFile(
  page: import('@playwright/test').Page,
  themePath: string,
  fileName: string
) {
  const fileContent = fs.readFileSync(themePath, 'utf-8')

  const dropZone = page.getByRole('button', {
    name: /drop zone for theme files/i,
  })
  await expect(dropZone).toBeVisible()

  const dataTransfer = await page.evaluateHandle(
    ({ content, name }) => {
      const dt = new DataTransfer()
      const file = new File([content], name, { type: 'application/json' })
      dt.items.add(file)
      return dt
    },
    { content: fileContent, name: fileName }
  )

  await dropZone.dispatchEvent('drop', { dataTransfer })

  // Wait for editor to load
  await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 })
}

test.describe('Save Button', () => {
  test('should show save button disabled initially after loading file', async ({
    page,
  }) => {
    await page.goto('/')
    const testThemePath = path.join(__dirname, 'fixtures', 'test-theme.json')
    await loadThemeFile(page, testThemePath, 'test-theme.json')

    // Get the save button
    const saveButton = page.getByRole('button', { name: /save/i })
    await expect(saveButton).toBeVisible()

    // Save button should be disabled (no changes yet)
    await expect(saveButton).toBeDisabled()
  })

  test('should enable save button after editing a color', async ({ page }) => {
    await page.goto('/')
    const testThemePath = path.join(__dirname, 'fixtures', 'test-theme.json')
    await loadThemeFile(page, testThemePath, 'test-theme.json')

    // Verify save button starts disabled
    const saveButton = page.getByRole('button', { name: /save/i })
    await expect(saveButton).toBeDisabled()

    // Select a color by clicking the background button
    const backgroundButton = page
      .getByRole('button', { name: /background/i })
      .first()
    await backgroundButton.click()

    // Wait for color editor panel to be ready
    const hexInput = page.getByLabel('Hex color')
    await expect(hexInput).toBeVisible()

    // Edit the hex value
    await hexInput.clear()
    await hexInput.fill('#ff0000')
    await hexInput.press('Tab')

    // Wait a moment for the state to propagate
    await page.waitForTimeout(100)

    // Save button should now be enabled
    await expect(saveButton).toBeEnabled()
  })

  test('should enable save button after adding a new color', async ({
    page,
  }) => {
    await page.goto('/')
    const testThemePath = path.join(__dirname, 'fixtures', 'test-theme.json')
    await loadThemeFile(page, testThemePath, 'test-theme.json')

    // Verify save button starts disabled
    const saveButton = page.getByRole('button', { name: /save/i })
    await expect(saveButton).toBeDisabled()

    // Find an undefined color (should have a dashed border)
    // Look for a color that says "(undefined)" or has the undefined indicator
    const undefinedColor = page
      .locator('[data-color-path]')
      .filter({ hasNot: page.locator('.bg-checkered') })
      .first()

    // If we find any undefined color button, click it
    const colorButton = page
      .getByRole('button', { name: /text\.accent/i })
      .first()

    if (await colorButton.isVisible()) {
      await colorButton.click()

      // Wait for color editor panel
      await expect(page.getByLabel('Hex color')).toBeVisible()

      // Save button should now be enabled (adding a color creates unsaved changes)
      await expect(saveButton).toBeEnabled()
    }
  })

  test('should show unsaved changes indicator in filename', async ({
    page,
  }) => {
    await page.goto('/')
    const testThemePath = path.join(__dirname, 'fixtures', 'test-theme.json')
    await loadThemeFile(page, testThemePath, 'test-theme.json')

    // Initially, no asterisk should be shown
    const filenameButton = page.getByRole('button', {
      name: /test-theme\.json/i,
    })
    await expect(filenameButton).toBeVisible()
    await expect(filenameButton).not.toContainText('*')

    // Select and edit a color
    const backgroundButton = page
      .getByRole('button', { name: /background/i })
      .first()
    await backgroundButton.click()

    const hexInput = page.getByLabel('Hex color')
    await expect(hexInput).toBeVisible()

    await hexInput.clear()
    await hexInput.fill('#abcdef')
    await hexInput.press('Tab')

    // Wait for state to propagate
    await page.waitForTimeout(100)

    // Now the filename button should show an asterisk indicating unsaved changes
    await expect(filenameButton).toContainText('*')
  })

  test('should disable save button after undo to original state', async ({
    page,
  }) => {
    await page.goto('/')
    const testThemePath = path.join(__dirname, 'fixtures', 'test-theme.json')
    await loadThemeFile(page, testThemePath, 'test-theme.json')

    const saveButton = page.getByRole('button', { name: /save/i })
    await expect(saveButton).toBeDisabled()

    // Select and edit a color
    const backgroundButton = page
      .getByRole('button', { name: /background/i })
      .first()
    await backgroundButton.click()

    const hexInput = page.getByLabel('Hex color')
    await expect(hexInput).toBeVisible()

    await hexInput.clear()
    await hexInput.fill('#123456')
    await hexInput.press('Tab')

    // Wait for change to register
    await page.waitForTimeout(100)

    // Save button should be enabled
    await expect(saveButton).toBeEnabled()

    // Undo the change
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
    await page.keyboard.press(`${modifier}+z`)

    // Save button should be disabled again (back to original state)
    await expect(saveButton).toBeDisabled()
  })
})
