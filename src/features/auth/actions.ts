'use server'

import { redirect } from 'next/navigation'
import type { Route } from 'next'
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
