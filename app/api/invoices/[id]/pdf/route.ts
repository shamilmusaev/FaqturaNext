import { PDF_ORG_COLUMNS, invoiceToPdfData } from '@/features/invoices/pdf-data'
import { getInvoice } from '@/features/invoices/queries'
import { requireUser } from '@/lib/auth'
import { getTemplate } from '@/lib/pdf/templates'
import { createServerClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const { organizationId } = await requireUser()

  const invoice = await getInvoice(id)
  if (!invoice) return new NextResponse('Invoice not found', { status: 404 })

  const supabase = await createServerClient()
  const { data: org } = await supabase
    .from('organizations')
    .select(PDF_ORG_COLUMNS)
    .eq('id', organizationId)
    .maybeSingle()
  if (!org) return new NextResponse('Organization not found', { status: 404 })

  const { Component } = getTemplate(invoice.template)
  const pdfBuffer = await renderToBuffer(Component({ invoice: invoiceToPdfData(invoice, org) }))
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
