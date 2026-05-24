import { createServerClient } from '@/lib/supabase/server'
import type { Route } from 'next'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ next?: string }>
}

/**
 * Dev-only auto-login. When DEV_AUTO_LOGIN_EMAIL / PASSWORD env vars are set
 * and no session exists, the middleware redirects here. We sign in server-side
 * (sets session cookie) and bounce to the requested page.
 *
 * Remove this route — and the env vars — before production.
 */
export default async function AutoLoginPage({ searchParams }: Props) {
  const email = process.env.DEV_AUTO_LOGIN_EMAIL
  const password = process.env.DEV_AUTO_LOGIN_PASSWORD
  const { next } = await searchParams
  const target = (next && next.startsWith('/') ? next : '/overview') as Route

  if (!email || !password) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-ink/70">
          Dev auto-login disabled. Set <code>DEV_AUTO_LOGIN_EMAIL</code> and{' '}
          <code>DEV_AUTO_LOGIN_PASSWORD</code> in <code>.env.local</code>.
        </p>
      </div>
    )
  }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <pre className="text-sm text-neg whitespace-pre-wrap max-w-xl">
          Auto-login failed: {error.message}
        </pre>
      </div>
    )
  }

  redirect(target)
}
