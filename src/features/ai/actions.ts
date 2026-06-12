'use server'

import { listLineItemHistory } from '@/features/invoices/queries'
import { aiModel, isAiConfigured } from '@/lib/ai/provider'
import { AI_LIMITS, rateLimit } from '@/lib/ai/rate-limit'
import { requireUser } from '@/lib/auth'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'
import { polishAllSystemPrompt, polishSystemPrompt } from './prompts'

const PolishInputSchema = z.object({
  text: z.string().min(1).max(2000),
  context: z.enum(['line', 'notes']),
  language: z.enum(['sv', 'en']),
  // Other line descriptions on the same invoice, used as a style reference so
  // the rewrite matches their capitalization and terminology.
  siblings: z.array(z.string().max(500)).max(20).optional(),
})

export type PolishInput = z.infer<typeof PolishInputSchema>
export type PolishResult = { text: string } | { error: 'notConfigured' | 'failed' | 'rateLimited' }

/** Rewrite a line description or the notes block professionally. */
export async function polishTextAction(input: PolishInput): Promise<PolishResult> {
  const { userId } = await requireUser()

  const parsed = PolishInputSchema.safeParse(input)
  if (!parsed.success) return { error: 'failed' }
  if (!isAiConfigured()) return { error: 'notConfigured' }
  if (!rateLimit(`polish:${userId}`, AI_LIMITS.polish).ok) return { error: 'rateLimited' }

  try {
    const { siblings, context, text: target } = parsed.data
    const useSiblings = context === 'line' && siblings && siblings.length > 0
    const prompt = useSiblings
      ? [
          'Other line items already on this invoice, for style reference only — do NOT rewrite these, only match their capitalization and terminology:',
          ...siblings.map((s) => `- ${s}`),
          '',
          'Rewrite only the following line item:',
          target,
        ].join('\n')
      : target

    const { text } = await generateText({
      model: aiModel(),
      system: polishSystemPrompt(context, parsed.data.language),
      prompt,
    })
    const cleaned = text.trim()
    return cleaned ? { text: cleaned } : { error: 'failed' }
  } catch {
    return { error: 'failed' }
  }
}

/** A past line item offered as a ghost-text suggestion in description fields. */
export type LineSuggestion = {
  description: string
  unitPriceCents: string // bigint serialized for the wire
  unit: string | null
  vatRate: number
}

/**
 * Returns the org's past line items (rates preferred for the given client) so
 * the editor can offer ghost-text autocomplete. DB-only, no model call.
 */
export async function lineSuggestionsAction(input?: {
  clientId?: string
}): Promise<LineSuggestion[]> {
  await requireUser()
  try {
    const history = await listLineItemHistory({ clientId: input?.clientId, limit: 60 })
    return history.map((h) => ({
      description: h.description,
      unitPriceCents: h.unitPriceCents.toString(),
      unit: h.unit,
      vatRate: h.vatRate,
    }))
  } catch {
    return []
  }
}

const PolishAllInputSchema = z.object({
  lines: z.array(z.string().min(1).max(500)).min(1).max(50),
  language: z.enum(['sv', 'en']),
})

export type PolishAllInput = z.infer<typeof PolishAllInputSchema>
export type PolishAllResult =
  | { lines: string[] }
  | { error: 'notConfigured' | 'failed' | 'rateLimited' }

/**
 * Rewrite every line description in one call so the whole invoice reads in a
 * consistent voice. Returns the rewritten lines in the same order; the count
 * must match or it's treated as a failure (the caller keeps the originals).
 */
export async function polishAllLinesAction(input: PolishAllInput): Promise<PolishAllResult> {
  const { userId } = await requireUser()

  const parsed = PolishAllInputSchema.safeParse(input)
  if (!parsed.success) return { error: 'failed' }
  if (!isAiConfigured()) return { error: 'notConfigured' }
  if (!rateLimit(`polish-all:${userId}`, AI_LIMITS.polishAll).ok) return { error: 'rateLimited' }

  try {
    const { object } = await generateObject({
      model: aiModel(),
      schema: z.object({ lines: z.array(z.string().min(1).max(500)) }),
      system: polishAllSystemPrompt(parsed.data.language),
      prompt: parsed.data.lines.map((l, i) => `${i + 1}. ${l}`).join('\n'),
    })
    const out = object.lines.map((l) => l.trim()).filter(Boolean)
    if (out.length !== parsed.data.lines.length) return { error: 'failed' }
    return { lines: out }
  } catch {
    return { error: 'failed' }
  }
}
