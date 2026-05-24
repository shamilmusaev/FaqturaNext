import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'
import { supabaseEnv } from '@/lib/supabase/env'

/**
 * Dev-only auto-login. Route handlers can write cookies on the response, which
 * is what @supabase/ssr needs to persist the session. The RSC equivalent
 * silently dropped cookies, causing repeated sign-ins and Supabase rate limits.
 *
 * Remove this route — and the DEV_AUTO_LOGIN_* env vars — before production.
 */
export async function GET(request: NextRequest) {
  const email = process.env.DEV_AUTO_LOGIN_EMAIL
  const password = process.env.DEV_AUTO_LOGIN_PASSWORD
  const nextParam = request.nextUrl.searchParams.get('next')
  const target = nextParam && nextParam.startsWith('/') ? nextParam : '/overview'

  if (!email || !password) {
    return new NextResponse(
      'Dev auto-login disabled. Set DEV_AUTO_LOGIN_EMAIL and DEV_AUTO_LOGIN_PASSWORD in .env.local.',
      { status: 503, headers: { 'content-type': 'text/plain' } },
    )
  }

  const response = NextResponse.redirect(new URL(target, request.url))
  const { url, anonKey } = supabaseEnv()

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // If a session already exists, skip the password call to avoid rate-limit
  // when navigating around (middleware can still send us here briefly).
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) return response

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return new NextResponse(`Auto-login failed: ${error.message}`, {
      status: 500,
      headers: { 'content-type': 'text/plain' },
    })
  }

  return response
}
