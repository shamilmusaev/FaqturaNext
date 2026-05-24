import { expect, test } from '@playwright/test'

// Reuse a unique client per run to avoid cross-test interference.
const tag = Date.now().toString(36).slice(-6)
const clientName = `Invoice PW ${tag}`

test.describe
  .serial('invoices CRUD + status flow', () => {
    test.beforeAll(async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await ctx.newPage()
      await page.goto('/clients/new')
      await page.getByLabel('Name').fill(clientName)
      await page.getByRole('button', { name: 'Create client' }).click()
      await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/)
      await ctx.close()
    })

    test('create draft with two line items', async ({ page }) => {
      await page.goto('/invoices/new')
      await expect(page.getByRole('heading', { name: 'New invoice' })).toBeVisible()

      // Pick the client we just created
      await page.getByLabel('Client').selectOption({ label: clientName })

      // First line item is present by default — fill it
      await page.getByLabel('Description').first().fill('Senior consulting')
      await page.getByLabel('Qty').first().fill('10')
      // MoneyInput accepts the localised number; sv-SE uses comma decimal
      await page.getByLabel('Unit price').first().fill('1250,00')

      // Add a second line
      await page.getByRole('button', { name: 'Add line' }).click()
      await page.getByLabel('Description').nth(1).fill('Travel reimbursement')
      await page.getByLabel('Qty').nth(1).fill('1')
      await page.getByLabel('Unit price').nth(1).fill('540,00')

      // Submit
      await page.getByRole('button', { name: 'Create invoice' }).click()

      // Lands on detail page
      await expect(page).toHaveURL(/\/invoices\/[0-9a-f-]{36}$/)
      await expect(page.getByText(clientName)).toBeVisible()
      // Status chip starts as Utkast (Swedish brand term)
      await expect(page.getByText('Utkast').first()).toBeVisible()
    })

    test('send → mark paid; PDF download is reachable', async ({ page }) => {
      // Navigate to the latest invoice for our client via the list
      await page.goto('/invoices')
      await page.getByText(clientName).first().click()
      await expect(page).toHaveURL(/\/invoices\/[0-9a-f-]{36}$/)

      // Send (confirm dialog)
      page.once('dialog', (d) => d.accept())
      await page.getByRole('button', { name: 'Send invoice' }).click()
      // After refresh status flips to Faktura skickad
      await page.reload()
      await expect(page.getByText('Faktura skickad').first()).toBeVisible()

      // PDF link should respond 200 application/pdf
      const pdfLink = page.getByRole('link', { name: /^PDF$/i })
      const href = await pdfLink.getAttribute('href')
      expect(href).toMatch(/\/api\/invoices\/[0-9a-f-]{36}\/pdf$/)
      const res = await page.request.get(href as string)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toContain('application/pdf')

      // Mark paid
      page.once('dialog', (d) => d.accept())
      await page.getByRole('button', { name: 'Mark as paid' }).click()
      await page.reload()
      await expect(page.getByText('Betald').first()).toBeVisible()
    })

    test('list filter pills narrow by status', async ({ page }) => {
      await page.goto('/invoices')
      await page.getByRole('button', { name: 'Paid' }).click()
      await expect(page).toHaveURL(/status=paid/)
      await expect(page.getByText(clientName).first()).toBeVisible()
    })
  })
