import { type RateReference, magicFillSystemPrompt } from '@/features/ai/prompts'
import { AiLineSchema, MagicFillRequestSchema } from '@/features/ai/schema'
import { listLineItemHistory } from '@/features/invoices/queries'
import { aiModel, isAiConfigured } from '@/lib/ai/provider'
import { AI_LIMITS, rateLimit } from '@/lib/ai/rate-limit'
import { createServerClient } from '@/lib/supabase/server'
import { streamObject } from 'ai'

// Generating + streaming line items can take a while on long notes.
export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req: Request) {
  // Auth: a valid session is enough. Unlike server actions we return 401 rather
  // than redirecting, since this is a fetch endpoint.
  const supabase = await createServerClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) return new Response('Unauthorized', { status: 401 })

  if (!isAiConfigured()) return new Response('AI not configured', { status: 503 })

  const limit = rateLimit(`magic-fill:${userId}`, AI_LIMITS.magicFill)
  if (!limit.ok) {
    return new Response('Too many requests', {
      status: 429,
      headers: { 'retry-after': String(limit.retryAfterSeconds) },
    })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const parsed = MagicFillRequestSchema.safeParse(body)
  if (!parsed.success) return new Response('Bad request', { status: 400 })

  // Price memory: mine the user's past line items so the model can reuse their
  // usual rates. Non-fatal — fall back to no rates if the lookup fails.
  let rates: RateReference[] = []
  try {
    const history = await listLineItemHistory({ clientId: parsed.data.clientId })
    rates = history.map((h) => ({
      description: h.description,
      unitPrice: Number(h.unitPriceCents) / 100,
      unit: h.unit,
      vatRate: h.vatRate,
    }))
  } catch {
    /* keep rates empty */
  }

  const result = streamObject({
    model: aiModel(),
    output: 'array',
    schema: AiLineSchema,
    system: magicFillSystemPrompt(parsed.data.language, parsed.data.currency, rates),
    prompt: parsed.data.notes,
  })

  return result.toTextStreamResponse()
}
