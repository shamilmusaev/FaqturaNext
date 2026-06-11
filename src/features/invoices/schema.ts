import { DEFAULT_TEMPLATE_ID, isTemplateId } from '@/lib/pdf/templates/ids'
import { z } from 'zod'

export const InvoiceStatusEnum = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>

export const RotRutTypeEnum = z.enum(['ROT', 'RUT'])
export type RotRutType = z.infer<typeof RotRutTypeEnum>

export const LineItemInputSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().positive(),
  unit: z.string().max(20).optional(),
  unitPriceCents: z.bigint().nonnegative(),
  vatRate: z.union([z.literal(0), z.literal(6), z.literal(12), z.literal(25)]),
  discountPercent: z.number().min(0).max(100).default(0),
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
  // Swedish invoice fields (Phase 2).
  reverseVat: z.boolean().default(false),
  rotRutType: RotRutTypeEnum.nullish(),
  rotRutCents: z.bigint().nonnegative().default(0n),
  ourReference: z.string().max(200).optional(),
  theirReference: z.string().max(200).optional(),
  orderNumber: z.string().max(100).optional(),
  paymentTermsDays: z.number().int().min(0).max(365).optional(),
  lineItems: z.array(LineItemInputSchema).min(1, 'Add at least one line item'),
})

export type InvoiceInput = z.infer<typeof InvoiceInputSchema>
