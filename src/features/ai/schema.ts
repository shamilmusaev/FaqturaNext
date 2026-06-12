import { z } from 'zod'

// Shared by the API route (server) and the dialog (client) — keep free of
// `server-only` so the browser can validate the streamed objects too.

/**
 * One invoice line as produced by the model. Money is a plain kronor number
 * here; it's converted to bigint öre at the trust boundary (see convert.ts) so
 * bigint never has to cross JSON.
 */
export const AiLineSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  // Prompt constrains this to 'h' | 'st' | ''; convert.ts re-checks.
  unit: z.string().max(20),
  unitPrice: z.number().nonnegative(),
  vatRate: z.union([z.literal(0), z.literal(6), z.literal(12), z.literal(25)]),
  discountPercent: z.number().min(0).max(100),
})

export type AiLine = z.infer<typeof AiLineSchema>

export const MagicFillRequestSchema = z.object({
  notes: z.string().min(1).max(8000),
  language: z.enum(['sv', 'en']).default('sv'),
  currency: z.string().min(1).max(3).default('SEK'),
  // Optional: prefer rates from invoices for this client when filling prices.
  clientId: z.string().uuid().optional(),
})

export type MagicFillRequest = z.infer<typeof MagicFillRequestSchema>
