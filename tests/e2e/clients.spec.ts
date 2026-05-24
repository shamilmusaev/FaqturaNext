import { expect, test } from '@playwright/test'

const tag = Date.now().toString(36).slice(-6)

test.describe('clients CRUD', () => {
  test('create, view, edit, archive, unarchive', async ({ page }) => {
    const name = `Playwright Co ${tag}`
    const email = `pw-${tag}@example.com`

    // Open clients list
    await page.goto('/clients')
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible()

    // Open new client form
    await page
      .getByRole('link', { name: /^New client$/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/clients\/new$/)

    // Fill required field + email
    await page.getByLabel('Name').fill(name)
    await page.getByLabel('Email').fill(email)

    // Submit
    await page.getByRole('button', { name: 'Create client' }).click()

    // Redirect to detail page (UUID in URL)
    await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/)
    await expect(page.getByRole('heading', { name })).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()

    // Edit
    await page.getByRole('link', { name: 'Edit' }).click()
    await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}\/edit$/)
    const notes = `Onboarded via Playwright ${tag}`
    await page.getByLabel('Notes').fill(notes)
    await page.getByRole('button', { name: 'Save client' }).click()
    await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/)
    await expect(page.getByText(notes)).toBeVisible()

    // Archive (window.confirm yes)
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Archive' }).click()
    // After archive we stay on detail; reload to see Archived chip.
    await page.reload()
    await expect(page.getByText('Archived').first()).toBeVisible()

    // Unarchive
    page.once('dialog', (d) => d.accept())
    await page.getByRole('button', { name: 'Restore' }).click()
    await page.reload()
    await expect(page.getByText('Archived')).toHaveCount(0)
  })

  test('search filters list by name', async ({ page }) => {
    await page.goto('/clients')
    // List should contain at least the client we created in the previous test.
    // Use the search input by aria-label.
    const search = page.getByLabel('Search by name or email')
    await search.fill(`Playwright Co ${tag}`)
    // Allow re-render
    await page.waitForTimeout(400)
    await expect(page.getByText(`Playwright Co ${tag}`)).toBeVisible()
  })
})
