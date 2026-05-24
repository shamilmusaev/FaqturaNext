import 'server-only'
import { createServerClient } from '@/lib/supabase/server'
import type { Route } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type AuthContext = {
  userId: string
  email: string
  organizationId: string
  role: 'owner' | 'admin' | 'member'
}

const ACTIVE_ORG_COOKIE = 'active_org_id'

export type AuthenticatedUser = {
  userId: string
  email: string
}

/**
 * Ensures the request has a Supabase session. Use in actions that run before
 * membership exists (onboarding) — does NOT redirect to /onboarding.
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login' as Route)
  return { userId: user.id, email: user.email ?? '' }
}

export async function requireUser(): Promise<AuthContext> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login' as Route)

  const cookieStore = await cookies()
  const preferredOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value

  const { data: memberships } = await supabase
    .from('memberships')
    .select('organization_id, role, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!memberships || memberships.length === 0) redirect('/onboarding' as Route)

  const active = memberships.find((m) => m.organization_id === preferredOrg) ?? memberships[0]
  if (!active) redirect('/onboarding' as Route)

  return {
    userId: user.id,
    email: user.email ?? '',
    organizationId: active.organization_id,
    role: active.role as AuthContext['role'],
  }
}

export async function setActiveOrg(orgId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, { httpOnly: true, sameSite: 'lax', path: '/' })
}
