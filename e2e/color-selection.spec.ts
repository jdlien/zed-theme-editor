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

test.describe('Color Selection', () => {
  // Load theme before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const testThemePath = path.join(__dirname, 'fixtures', 'test-theme.json')
    await loadThemeFile(page, testThemePath, 'test-theme.json')
  })

  test('should display color list in sidebar', async ({ page }) => {
    // Verify the sidebar shows available colors
    // Use first() to select just the first match since "background" appears multiple times
    await expect(page.getByText('background').first()).toBeVisible()
    await expect(page.getByText('text').first()).toBeVisible()
  })

  test('should select a color from sidebar and show editor panel', async ({
    page,
  }) => {
    // Click on a color in the sidebar - use the button with the color name
    // The colors are rendered as buttons with the color key as text
    const backgroundColorButton = page
      .getByRole('button', { name: /background/i })
      .first()
    await backgroundColorButton.click()

    // Verify the color editor panel shows the selected color
    // Should show hex input with the color value
    const hexInput = page.getByLabel('Hex color')
    await expect(hexInput).toBeVisible()
  })

  test('should filter colors using search', async ({ page }) => {
    // Find the search/filter input
    const filterInput = page.getByPlaceholder(/filter/i)
    await expect(filterInput).toBeVisible()

    // Type to filter - using a specific term that should narrow results
    await filterInput.fill('muted')

    // Should show filtered results - text.muted should be visible in sidebar
    await expect(page.getByText('text.muted').first()).toBeVisible()
  })
})
