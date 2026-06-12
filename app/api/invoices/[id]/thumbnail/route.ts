import { PDF_ORG_COLUMNS } from '@/features/invoices/pdf-data'
import { getInvoice } from '@/features/invoices/queries'
import { requireUser } from '@/lib/auth'
import {
  THUMBNAIL_BUCKET,
  orgBrandingVersion,
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

// Coalesce concurrent renders for the same cache key within this instance, so a
// cold cards page firing N requests for the same invoice rasterizes it once.
const inFlight = new Map<string, Promise<Buffer>>()

function renderOnce(key: string, render: () => Promise<Buffer>): Promise<Buffer> {
  const existing = inFlight.get(key)
  if (existing) return existing
  const p = render().finally(() => inFlight.delete(key))
  inFlight.set(key, p)
  return p
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
  const supabase = await createServerClient()

  // Lightweight fetches for the cache key — avoid the full getInvoice (line
  // items + events) on the common cache-hit path.
  const [{ data: head }, { data: org }] = await Promise.all([
    supabase
      .from('invoices')
      .select('updated_at, template')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .maybeSingle(),
    supabase.from('organizations').select(PDF_ORG_COLUMNS).eq('id', organizationId).maybeSingle(),
  ])
  if (!head) return new NextResponse('Invoice not found', { status: 404 })
  if (!org) return new NextResponse('Organization not found', { status: 404 })

  const version = thumbnailVersion(head, orgBrandingVersion(org as Record<string, unknown>))
  const key = thumbnailKey(organizationId, id, version)

  // Cache hit: serve the stored PNG without re-rasterizing.
  const cached = await supabase.storage.from(THUMBNAIL_BUCKET).download(key)
  if (cached.data) {
    return png(new Uint8Array(await cached.data.arrayBuffer()), versioned)
  }

  // Miss: render once per key (coalescing concurrent requests), cache, serve.
  let buffer: Buffer
  try {
    buffer = await renderOnce(key, async () => {
      const invoice = await getInvoice(id)
      if (!invoice) throw new Error('invoice not found')
      const buf = await renderInvoiceThumbnail(invoice, org)
      await supabase.storage
        .from(THUMBNAIL_BUCKET)
        .upload(key, buf, { contentType: 'image/png', upsert: true })
      return buf
    })
  } catch {
    return new NextResponse('Thumbnail unavailable', { status: 404 })
  }
  return png(new Uint8Array(buffer), versioned)
}

export const runtime = 'nodejs'
