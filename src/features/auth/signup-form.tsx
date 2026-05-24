'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useActionState } from 'react'
import { type AuthActionResult, signupAction } from './actions'

const initialState: AuthActionResult = {}

export function SignupForm() {
  const t = useTranslations()
  const [state, action, pending] = useActionState(
    async (_prev: AuthActionResult, formData: FormData) => signupAction(formData),
    initialState,
  )
  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{t('auth.signupTitle')}</h1>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('auth.email')}
        <Input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        {t('auth.password')}
        <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </label>
      {state.error && <p className="text-sm text-neg">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? t('common.loading') : t('common.signUp')}
      </Button>
      <p className="text-sm text-ink/60">
        {t('auth.haveAccount')}{' '}
        <Link href={'/login' as Route} className="underline">
          {t('common.signIn')}
        </Link>
      </p>
    </form>
  )
}
