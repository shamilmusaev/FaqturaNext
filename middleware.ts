import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

const DEV_AUTO_LOGIN = Boolean(
  process.env.DEV_AUTO_LOGIN_EMAIL && process.env.DEV_AUTO_LOGIN_PASSWORD,
)

export async function middleware(request: NextRequest) {
  const { response, claims } = await updateSession(request)
  const url = request.nextUrl
  const isSignedIn = Boolean(claims?.sub)

  const isApp =
    url.pathname.startsWith('/overview') ||
    url.pathname.startsWith('/invoices') ||
    url.pathname.startsWith('/clients') ||
    url.pathname.startsWith('/expenses') ||
    url.pathname.startsWith('/reports') ||
    url.pathname.startsWith('/settings')
  const isOnboarding = url.pathname.startsWith('/onboarding')
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup'
  const isAutoLogin = url.pathname === '/auto-login'

  // Dev shortcut: when DEV_AUTO_LOGIN env is set and the visitor lands
  // unauthenticated, send them through /auto-login instead of /login so they
  // never have to type credentials.
  if (DEV_AUTO_LOGIN && !isSignedIn && (isApp || isOnboarding || url.pathname === '/')) {
    if (!isAutoLogin) {
      const next = url.pathname === '/' ? '/overview' : url.pathname
      const redirectUrl = new URL('/auto-login', request.url)
      redirectUrl.searchParams.set('next', next)
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (isApp && !isSignedIn) {
    const redirect = new URL('/login', request.url)
    redirect.searchParams.set('next', url.pathname)
    return NextResponse.redirect(redirect)
  }

  if (isOnboarding && !isSignedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && isSignedIn) {
    const res = NextResponse.redirect(new URL('/overview', request.url))
    for (const v of response.headers.getSetCookie()) {
      res.headers.append('set-cookie', v)
    }
    return res
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
