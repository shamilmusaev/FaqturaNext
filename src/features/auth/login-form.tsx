'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { loginAction, type AuthActionResult } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const initialState: AuthActionResult = {}

export function LoginForm() {
  const t = useTranslations()
  const [state, action, pending] = useActionState(
    async (_prev: AuthActionResult, formData: FormData) => loginAction(formData),
    initialState,
  )
  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{t('auth.loginTitle')}</h1>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('auth.email')}
        <Input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('auth.password')}
        <Input name="password" type="password" autoComplete="current-password" required minLength={8} />
      </label>
      {state.error && <p className="text-sm text-neg">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? t('common.loading') : t('common.signIn')}
      </Button>
      <p className="text-sm text-ink/60">
        {t('auth.noAccount')} <Link href={'/signup' as Route} className="underline">{t('common.signUp')}</Link>
      </p>
    </form>
  )
}
