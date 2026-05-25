import 'server-only'
import { createServerClient } from '@/lib/supabase/server'
import type { Route } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export type AuthContext = {
  userId: string
  email: string
  displayName: string | null
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
 * membership exists (onboarding). Does NOT redirect to /onboarding.
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login' as Route)
  return { userId: user.id, email: user.email ?? '' }
}

export const requireUser = cache(async (): Promise<AuthContext> => {
  const supabase = await createServerClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) redirect('/login' as Route)

  const cookieStore = await cookies()
  const preferredOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value

  const { data: memberships } = await supabase
    .from('memberships')
    .select('organization_id, role, created_at')
    .eq('user_id', claims.sub)
    .order('created_at', { ascending: true })

  if (!memberships || memberships.length === 0) redirect('/onboarding' as Route)

  const active = memberships.find((m) => m.organization_id === preferredOrg) ?? memberships[0]
  if (!active) redirect('/onboarding' as Route)

  // Prefer display_name from the JWT claims (no network). Only fall back to
  // auth.getUser() when claims don't carry user_metadata yet — this avoids a
  // sync round-trip on every navigation. After the next token refresh the
  // claims pick up the latest metadata automatically.
  const pickFrom = (src: Record<string, unknown> | undefined, k: string) =>
    typeof src?.[k] === 'string' ? (src[k] as string).trim() : ''
  const claimsMeta = (claims.user_metadata ?? {}) as Record<string, unknown>
  let metaName =
    pickFrom(claimsMeta, 'display_name') ||
    pickFrom(claimsMeta, 'name') ||
    pickFrom(claimsMeta, 'full_name')

  if (!metaName) {
    const { data: userData } = await supabase.auth.getUser()
    const meta = (userData.user?.user_metadata ?? {}) as Record<string, unknown>
    metaName =
      pickFrom(meta, 'display_name') || pickFrom(meta, 'name') || pickFrom(meta, 'full_name')
  }

  return {
    userId: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : '',
    displayName: metaName || null,
    organizationId: active.organization_id,
    role: active.role as AuthContext['role'],
  }
})

export async function setActiveOrg(orgId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, { httpOnly: true, sameSite: 'lax', path: '/' })
}
