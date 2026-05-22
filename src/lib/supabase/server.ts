import 'server-only'
import { createServerClient as supaCreateServer } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()
  return supaCreateServer(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: list => {
          for (const { name, value, options } of list) {
            try { cookieStore.set(name, value, options) } catch { /* called from RSC */ }
          }
        },
      },
    },
  )
}
