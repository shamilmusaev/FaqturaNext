import { DEFAULT_TEMPLATE_ID, isTemplateId } from '@/lib/pdf/templates/ids'
import { z } from 'zod'

export const InvoiceStatusEnum = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>

export const LineItemInputSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive(),
  unit: z.string().max(20).optional(),
  unitPriceCents: z.bigint().nonnegative(),
  vatRate: z.union([z.literal(0), z.literal(6), z.literal(12), z.literal(25)]),
})

export type LineItemInput = z.infer<typeof LineItemInputSchema>

export const InvoiceInputSchema = z.object({
  clientId: z.string().uuid(),
  issuedAt: z.string().date().optional(),
  dueAt: z.string().date(),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase ASCII letters (ISO 4217)')
    .default('SEK'),
  notes: z.string().max(2000).optional(),
  template: z
    .string()
    .refine(isTemplateId, 'Unknown invoice template')
    .default(DEFAULT_TEMPLATE_ID),
  lineItems: z.array(LineItemInputSchema).min(1, 'Add at least one line item'),
})

export type InvoiceInput = z.infer<typeof InvoiceInputSchema>
