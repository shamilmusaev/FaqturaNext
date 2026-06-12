import { z } from 'zod'

const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)

export const OrgAddressSchema = z.object({
  street: z.string().max(200).optional(),
  postal: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
})

export const CompanyInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  org_number: z.preprocess(blankToUndefined, z.string().max(50).optional()),
  vat_number: z.preprocess(blankToUndefined, z.string().max(50).optional()),
  address: OrgAddressSchema.optional(),
})

export const PaymentInputSchema = z.object({
  bank_name: z.preprocess(blankToUndefined, z.string().max(100).optional()),
  iban: z.preprocess(blankToUndefined, z.string().max(50).optional()),
  bankgiro: z.preprocess(blankToUndefined, z.string().max(20).optional()),
  plusgiro: z.preprocess(blankToUndefined, z.string().max(20).optional()),
  swish_number: z.preprocess(blankToUndefined, z.string().max(20).optional()),
})

export const InvoicingInputSchema = z.object({
  default_vat_rate: z.coerce.number().min(0).max(100),
  default_payment_terms_days: z.coerce.number().int().min(0).max(365),
  invoice_number_template: z
    .string()
    .min(1, 'Template is required')
    .max(50)
    .regex(/\{NNNN+\}/, 'Template must include {NNNN}'),
  currency: z.enum(['SEK', 'EUR', 'USD', 'NOK', 'DKK', 'GBP']),
})

export const LocalizationInputSchema = z.object({
  locale: z.enum(['sv-SE', 'en-US', 'en-GB', 'nb-NO', 'da-DK', 'fi-FI']),
})

export const ProfileInputSchema = z.object({
  display_name: z.preprocess(blankToUndefined, z.string().min(1).max(120).optional()),
})

export const EmailInputSchema = z.object({
  email: z.string().email().max(200),
})

export const PasswordInputSchema = z
  .object({
    password: z.string().min(8, 'At least 8 characters').max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'passwordMismatch',
    path: ['confirm'],
  })

export type CompanyInput = z.infer<typeof CompanyInputSchema>
export type PaymentInput = z.infer<typeof PaymentInputSchema>
export type InvoicingInput = z.infer<typeof InvoicingInputSchema>
export type LocalizationInput = z.infer<typeof LocalizationInputSchema>
