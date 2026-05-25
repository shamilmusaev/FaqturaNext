import { expect, test } from '@playwright/test'

test.describe('dev auto-login', () => {
  test('protected route is reachable after auto-login redirect', async ({ page }) => {
    // Clearing cookies forces middleware to send us through /auto-login.
    await page.context().clearCookies()
    await page.goto('/overview')
    await expect(page).toHaveURL(/\/overview$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('user chip in topbar shows the dev account', async ({ page }) => {
    await page.goto('/overview')
    // dev user email lives in the topbar user chip; on small screens it's hidden,
    // but on the default 1280-wide Playwright viewport it should be visible.
    await expect(page.getByText(/@/).first()).toBeVisible()
  })
})

// NOTE: signup / login UI is intentionally bypassed in dev mode via
// DEV_AUTO_LOGIN_EMAIL/PASSWORD env vars. To test the real auth flow, unset
// those vars and run a separate spec. Out of scope while solo-testing.
