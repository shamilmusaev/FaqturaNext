import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const url = request.nextUrl

  const isApp =
    url.pathname.startsWith('/overview') ||
    url.pathname.startsWith('/invoices') ||
    url.pathname.startsWith('/clients') ||
    url.pathname.startsWith('/settings')
  const isOnboarding = url.pathname.startsWith('/onboarding')
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup'

  if (isApp && !user) {
    const redirect = new URL('/login', request.url)
    redirect.searchParams.set('next', url.pathname)
    return NextResponse.redirect(redirect)
  }

  if (isOnboarding && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && user) {
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
