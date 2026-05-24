import { expect, test } from '@playwright/test'

test.describe('dashboard smoke', () => {
  test('overview greets the user and shows the main metric cards', async ({ page }) => {
    await page.goto('/overview')
    // Greeting is "Good morning|afternoon|evening, <Name>"
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/Good (morning|afternoon|evening)/i)

    // The four stat cards
    await expect(page.getByText('Outstanding')).toBeVisible()
    await expect(page.getByText('Paid this month')).toBeVisible()
    await expect(page.getByText('Avg days to pay')).toBeVisible()
    await expect(page.getByText('Sent this week')).toBeVisible()
  })

  test('root path redirects authenticated user to overview', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/overview$/)
  })

  test('top nav navigates between sections', async ({ page }) => {
    await page.goto('/overview')
    await page
      .getByRole('link', { name: /^Clients$/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/clients$/)
    await page
      .getByRole('link', { name: /^Invoices$/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/invoices$/)
    await page
      .getByRole('link', { name: /^Settings$/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/settings$/)
  })
})
