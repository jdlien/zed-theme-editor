import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('File Loading', () => {
  test('should load a theme file via drag and drop', async ({ page }) => {
    await page.goto('/')

    // Get the test fixture content
    const testThemePath = path.join(__dirname, 'fixtures', 'test-theme.json')
    const fileContent = fs.readFileSync(testThemePath, 'utf-8')

    // Get the drop zone
    const dropZone = page.getByRole('button', {
      name: /drop zone for theme files/i,
    })
    await expect(dropZone).toBeVisible()

    // Simulate drag and drop using Playwright's DataTransfer approach
    const dataTransfer = await page.evaluateHandle(
      ({ content, fileName }) => {
        const dt = new DataTransfer()
        const file = new File([content], fileName, {
          type: 'application/json',
        })
        dt.items.add(file)
        return dt
      },
      { content: fileContent, fileName: 'test-theme.json' }
    )

    // Dispatch the drop event
    await dropZone.dispatchEvent('drop', { dataTransfer })

    // Verify theme loaded - should see the theme name in toolbar
    await expect(page.getByText('test-theme.json')).toBeVisible()

    // Verify the JSON editor panel is visible (lazy loaded)
    await expect(page.locator('.cm-editor')).toBeVisible({ timeout: 10000 })

    // Verify color list is shown in sidebar (confirming theme loaded)
    await expect(page.getByText('background').first()).toBeVisible()
  })

  test('should show drop zone initially', async ({ page }) => {
    await page.goto('/')

    const dropZone = page.getByRole('button', {
      name: /drop zone for theme files/i,
    })
    await expect(dropZone).toBeVisible()
    await expect(
      page.getByText('Drop a Zed theme .json file here')
    ).toBeVisible()
  })
})
