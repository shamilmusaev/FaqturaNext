import { PDF_ORG_COLUMNS } from '@/features/invoices/pdf-data'
import { getInvoice } from '@/features/invoices/queries'
import { requireUser } from '@/lib/auth'
import {
  THUMBNAIL_BUCKET,
  renderInvoiceThumbnail,
  thumbnailKey,
  thumbnailVersion,
} from '@/lib/pdf/thumbnail'
import { createServerClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

interface Context {
  params: Promise<{ id: string }>
}

function png(body: Uint8Array, versioned: boolean): NextResponse {
  return new NextResponse(body as BodyInit, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      // A ?v=<version> URL is content-addressed, so it can be cached hard;
      // the bare URL must revalidate since its content changes on edits.
      'cache-control': versioned
        ? 'private, max-age=31536000, immutable'
        : 'private, max-age=0, must-revalidate',
    },
  })
}

export async function GET(req: NextRequest, ctx: Context) {
  const { id } = await ctx.params
  const { organizationId } = await requireUser()
  const versioned = req.nextUrl.searchParams.has('v')

  const invoice = await getInvoice(id)
  if (!invoice) return new NextResponse('Invoice not found', { status: 404 })

  const supabase = await createServerClient()
  const { data: org } = await supabase
    .from('organizations')
    .select(PDF_ORG_COLUMNS)
    .eq('id', organizationId)
    .maybeSingle()
  if (!org) return new NextResponse('Organization not found', { status: 404 })

  const key = thumbnailKey(organizationId, id, thumbnailVersion(invoice))

  // Cache hit: serve the stored PNG without re-rasterizing.
  const cached = await supabase.storage.from(THUMBNAIL_BUCKET).download(key)
  if (cached.data) {
    return png(new Uint8Array(await cached.data.arrayBuffer()), versioned)
  }

  // Miss: render, cache, serve.
  const buffer = await renderInvoiceThumbnail(invoice, org)
  await supabase.storage
    .from(THUMBNAIL_BUCKET)
    .upload(key, buffer, { contentType: 'image/png', upsert: true })
  return png(new Uint8Array(buffer), versioned)
}

export const runtime = 'nodejs'
