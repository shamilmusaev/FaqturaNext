import { z } from 'zod'

export const AddressSchema = z.object({
  street: z.string().max(200).optional(),
  postal: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
})

const blankToUndefined = (v: unknown) => (v === '' ? undefined : v)

export const ClientInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.preprocess(blankToUndefined, z.string().email().max(200).optional()),
  org_number: z.preprocess(blankToUndefined, z.string().max(50).optional()),
  vat_number: z.preprocess(blankToUndefined, z.string().max(50).optional()),
  address: AddressSchema.optional(),
  notes: z.preprocess(blankToUndefined, z.string().max(2000).optional()),
})

export type ClientInput = z.infer<typeof ClientInputSchema>
