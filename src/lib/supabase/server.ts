import 'server-only'
import { createServerClient as supaCreateServer } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import { supabaseEnv } from './env'

export async function createServerClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = supabaseEnv()
  return supaCreateServer<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            /* called from RSC */
          }
        }
      },
    },
  })
}
