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

test.describe('Color Editing', () => {
  // Load theme and select a color before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const testThemePath = path.join(__dirname, 'fixtures', 'test-theme.json')
    await loadThemeFile(page, testThemePath, 'test-theme.json')

    // Select the first background color by clicking the button
    const backgroundButton = page
      .getByRole('button', { name: /background/i })
      .first()
    await backgroundButton.click()

    // Wait for color editor panel to be ready
    await expect(page.getByLabel('Hex color')).toBeVisible()
  })

  test('should edit color via hex input', async ({ page }) => {
    const hexInput = page.getByLabel('Hex color')

    // Clear and type new hex value
    await hexInput.clear()
    await hexInput.fill('#ff0000')

    // Tab away to trigger blur
    await hexInput.press('Tab')

    // Verify the input shows the new value
    await expect(hexInput).toHaveValue(/#ff0000/i)
  })

  test('should edit color via RGB inputs', async ({ page }) => {
    // Find RGB inputs - look for the Red input
    const redInput = page.getByLabel('Red')
    await expect(redInput).toBeVisible()

    // Change the red value
    await redInput.clear()
    await redInput.fill('255')
    await redInput.press('Tab')

    // Verify the hex input updated - should now have FF in red position
    const hexInput = page.getByLabel('Hex color')
    const hexValue = await hexInput.inputValue()
    expect(hexValue.toLowerCase()).toMatch(/^#ff/)
  })

  test('should show color picker', async ({ page }) => {
    // The color picker component should be visible
    // It has a saturation/lightness area slider
    const colorPicker = page.getByRole('slider', {
      name: /saturation and brightness/i,
    })
    await expect(colorPicker).toBeVisible()
  })

  test('should support undo with keyboard shortcut', async ({ page }) => {
    const hexInput = page.getByLabel('Hex color')
    const originalValue = await hexInput.inputValue()

    // Edit the hex value
    await hexInput.clear()
    await hexInput.fill('#abcdef')
    await hexInput.press('Tab')

    // Wait for change to register
    await page.waitForTimeout(100)

    // Press Cmd/Ctrl+Z to undo
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
    await page.keyboard.press(`${modifier}+z`)

    // The hex input should revert to original value
    await expect(hexInput).toHaveValue(new RegExp(originalValue, 'i'))
  })
})
