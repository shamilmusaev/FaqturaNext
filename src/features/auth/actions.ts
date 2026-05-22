'use server'

import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { CredentialsSchema } from './schema'

export type AuthActionResult = { error?: string }

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: error.message }

  redirect('/overview' as Route)
}

export async function signupAction(formData: FormData): Promise<AuthActionResult> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signUp(parsed.data)
  if (error) return { error: error.message }

  redirect('/onboarding' as Route)
}

export async function logoutAction() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/login' as Route)
}

const OrgSchema = z.object({
  name: z.string().min(1).max(120),
  org_number: z.string().optional(),
  vat_number: z.string().optional(),
})

export async function createOrganizationAction(formData: FormData): Promise<AuthActionResult> {
  const parsed = OrgSchema.safeParse({
    name: formData.get('name'),
    org_number: formData.get('org_number') || undefined,
    vat_number: formData.get('vat_number') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const supabase = await createServerClient()
  const { error } = await supabase.rpc('create_organization', {
    p_name: parsed.data.name,
    p_org_number: parsed.data.org_number ?? null,
    p_vat_number: parsed.data.vat_number ?? null,
  })
  if (error) return { error: error.message }

  redirect('/overview' as Route)
}
