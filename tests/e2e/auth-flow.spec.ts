import { test, expect } from '@playwright/test'

test('signup → onboarding → overview, then logout and login again', async ({ page }) => {
  const email = `e2e-${Date.now()}@faqtura.local`
  const password = 'password123'

  await page.goto('/signup')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /create account/i }).click()

  await expect(page).toHaveURL(/\/onboarding/)
  await page.getByLabel(/company name/i).fill('Playwright AB')
  await page.getByRole('button', { name: /create company/i }).click()

  await expect(page).toHaveURL(/\/overview/)
  await expect(page.getByText(email)).toBeVisible()

  await page.getByRole('button', { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/login/)

  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/overview/)
})

test('unauthenticated overview redirects to login', async ({ page }) => {
  await page.goto('/overview')
  await expect(page).toHaveURL(/\/login/)
})
