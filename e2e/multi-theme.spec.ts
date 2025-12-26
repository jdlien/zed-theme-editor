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

test.describe('Multi-Theme Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const themePath = path.join(__dirname, 'fixtures', 'multi-theme.json')
    await loadThemeFile(page, themePath, 'multi-theme.json')
  })

  test('should display theme tabs for multi-theme file', async ({ page }) => {
    // Should see tabs for both themes
    await expect(page.getByRole('tab', { name: /One Dark/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /One Light/i })).toBeVisible()
  })

  test('should switch between themes when clicking tabs', async ({ page }) => {
    // First theme (One Dark) should be selected by default
    const darkTab = page.getByRole('tab', { name: /One Dark/i })
    const lightTab = page.getByRole('tab', { name: /One Light/i })

    await expect(darkTab).toHaveAttribute('aria-selected', 'true')
    await expect(lightTab).toHaveAttribute('aria-selected', 'false')

    // Click on One Light tab
    await lightTab.click()

    // Now One Light should be selected
    await expect(lightTab).toHaveAttribute('aria-selected', 'true')
    await expect(darkTab).toHaveAttribute('aria-selected', 'false')
  })

  test('should show different colors for each theme', async ({ page }) => {
    // Select background color in dark theme
    const backgroundButton = page
      .getByRole('button', { name: /background/i })
      .first()
    await backgroundButton.click()

    const hexInput = page.getByLabel('Hex color')
    await expect(hexInput).toBeVisible()

    // Get dark theme background color
    const darkBackground = await hexInput.inputValue()

    // Switch to light theme
    await page.getByRole('tab', { name: /One Light/i }).click()

    // Select background again
    await page.getByRole('button', { name: /background/i }).first().click()

    // Get light theme background color - should be different
    const lightBackground = await hexInput.inputValue()

    expect(darkBackground.toLowerCase()).not.toBe(lightBackground.toLowerCase())
  })
})
