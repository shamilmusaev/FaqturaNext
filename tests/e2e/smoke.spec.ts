import { test, expect } from '@playwright/test'

test('landing page renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Swedish freelancers')
})

test('overview placeholder renders', async ({ page }) => {
  await page.goto('/overview')
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
})
