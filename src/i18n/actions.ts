'use server'

import { cookies } from 'next/headers'
import { type Locale, locales } from './config'

export async function setLocaleAction(value: string): Promise<void> {
  if (!(locales as readonly string[]).includes(value)) return
  const store = await cookies()
  store.set('locale', value as Locale, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}
