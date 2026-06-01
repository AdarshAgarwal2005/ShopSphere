import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/ShopSphere/)

    const heading = page.locator('h1').first()

    await expect(heading).toContainText(/Modern everyday style|Products your client/)
  })
})
