import { renderToBuffer } from '@react-pdf/renderer'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getInvoice } from '@/features/invoices/queries'
import { requireUser } from '@/lib/auth'
import { InvoiceDocument, type InvoicePdfData } from '@/lib/pdf/InvoiceDocument'
import type { Database } from '@/lib/supabase/database.types'
import { createServerClient } from '@/lib/supabase/server'

type OrgRow = Pick<
  Database['public']['Tables']['organizations']['Row'],
  'name' | 'org_number' | 'vat_number' | 'address' | 'iban' | 'bankgiro'
>

interface Context {
  params: Promise<{ id: string }>
}

function toPdfData(
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoice>>>,
  org: OrgRow,
): InvoicePdfData {
  return {
    number: invoice.number,
    issuedAt: invoice.issued_at,
    dueAt: invoice.due_at,
    currency: invoice.currency,
    subtotalCents: BigInt(invoice.subtotal_cents),
    vatCents: BigInt(invoice.vat_cents),
    totalCents: BigInt(invoice.total_cents),
    notes: invoice.notes,
    organization: {
      name: org.name,
      org_number: org.org_number,
      vat_number: org.vat_number,
      address: (org.address as InvoicePdfData['organization']['address']) ?? null,
      iban: org.iban,
      bankgiro: org.bankgiro,
    },
    client: {
      name: invoice.client?.name ?? '—',
      email: invoice.client?.email ?? null,
      org_number: invoice.client?.org_number ?? null,
      vat_number: invoice.client?.vat_number ?? null,
      address: (invoice.client?.address as InvoicePdfData['client']['address']) ?? null,
    },
    lineItems: invoice.line_items.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unit: li.unit,
      unitPriceCents: BigInt(li.unit_price_cents),
      vatRate: Number(li.vat_rate),
      amountCents: BigInt(li.amount_cents),
    })),
  }
}

export async function GET(_req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const { organizationId } = await requireUser()

  const invoice = await getInvoice(id)
  if (!invoice) return new NextResponse('Invoice not found', { status: 404 })

  const supabase = await createServerClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('name, org_number, vat_number, address, iban, bankgiro')
    .eq('id', organizationId)
    .maybeSingle()
  if (!org) return new NextResponse('Organization not found', { status: 404 })

  const pdfBuffer = await renderToBuffer(InvoiceDocument({ invoice: toPdfData(invoice, org) }))
  const body = new Uint8Array(pdfBuffer)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${invoice.number}.pdf"`,
      'cache-control': 'private, no-store',
    },
  })
}

export const runtime = 'nodejs'
