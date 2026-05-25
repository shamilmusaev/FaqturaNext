import { AccountForm } from '@/features/settings/components/account-form'
import { createServerClient } from '@/lib/supabase/server'
import type { Route } from 'next'
import { redirect } from 'next/navigation'

export default async function SettingsAccountPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login' as Route)

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const storedName =
    (typeof meta.display_name === 'string' && meta.display_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    null

  const email = user.email ?? ''
  // Fall back to the same name shown in the topbar (derived from email)
  // so the field never looks empty while the menu shows a name.
  const displayName = storedName || emailToDisplayName(email)
  const hasStoredName = Boolean(storedName)

  return <AccountForm email={email} displayName={displayName} hasStoredName={hasStoredName} />
}

function emailToDisplayName(email: string): string {
  const local = email.split('@')[0] ?? ''
  const cleaned = local.replace(/[._-]+/g, ' ').trim()
  if (!cleaned) return ''
  return cleaned
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}
