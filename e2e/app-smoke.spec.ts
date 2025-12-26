import { test, expect } from '@playwright/test'

test.describe('App Smoke Tests', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/')

    // Check the page title
    await expect(page).toHaveTitle('Zed Theme Editor')

    // Verify the drop zone is visible
    const dropZone = page.getByRole('button', {
      name: /drop zone for theme files/i,
    })
    await expect(dropZone).toBeVisible()

    // Check for the file drop instruction text
    await expect(
      page.getByText('Drop a Zed theme .json file here')
    ).toBeVisible()
    await expect(page.getByText('or click to browse')).toBeVisible()
  })

  test('should show dark mode toggle in toolbar', async ({ page }) => {
    await page.goto('/')

    // Find the dark mode toggle switch
    const darkModeToggle = page.getByRole('switch', { name: /dark mode/i })
    await expect(darkModeToggle).toBeVisible()
  })

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/')

    const darkModeToggle = page.getByRole('switch', { name: /dark mode/i })

    // Get initial state
    const initialChecked = await darkModeToggle.isChecked()

    // Click to toggle
    await darkModeToggle.click()

    // Verify it changed
    const newChecked = await darkModeToggle.isChecked()
    expect(newChecked).not.toBe(initialChecked)
  })
})
