'use client'

import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { updateEmailAction, updatePasswordAction, updateProfileAction } from '../actions'
import { Field, SectionCard } from './section-card'
import { SettingsForm } from './settings-form'

interface Props {
  email: string
  displayName: string | null
  /** True when displayName came from auth.user_metadata, false when it was derived from email. */
  hasStoredName?: boolean
}

export function AccountForm({ email, displayName, hasStoredName = false }: Props) {
  const t = useTranslations('settings.account')
  return (
    <div className="flex flex-col gap-6">
      <SettingsForm
        action={updateProfileAction}
        successToastKey="settings.account.toast.profileSaved"
      >
        {({ err }) => (
          <SectionCard title={t('profileTitle')} subtitle={t('profileSubtitle')}>
            <Field
              label={t('fields.displayName')}
              error={err('display_name')}
              hint={
                !hasStoredName && displayName
                  ? 'Auto-suggested from your email — save to confirm.'
                  : undefined
              }
            >
              <Input
                name="display_name"
                defaultValue={displayName ?? ''}
                maxLength={120}
                autoComplete="name"
                placeholder="Anna Andersson"
              />
            </Field>
          </SectionCard>
        )}
      </SettingsForm>

      <SettingsForm
        action={updateEmailAction}
        successToastKey="settings.account.toast.emailRequested"
      >
        {({ err }) => (
          <SectionCard title={t('emailTitle')} subtitle={t('emailSubtitle')}>
            <Field
              label={t('fields.email')}
              hint={t('hints.email')}
              error={mapEmailError(err('email'), t)}
            >
              <Input
                name="email"
                type="email"
                defaultValue={email}
                required
                maxLength={200}
                autoComplete="email"
              />
            </Field>
          </SectionCard>
        )}
      </SettingsForm>

      <SettingsForm
        action={updatePasswordAction}
        successToastKey="settings.account.toast.passwordChanged"
        resetOnSuccess
      >
        {({ err }) => (
          <SectionCard title={t('passwordTitle')} subtitle={t('passwordSubtitle')}>
            <Field
              label={t('fields.newPassword')}
              hint={t('hints.password')}
              error={err('password')}
            >
              <Input
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={200}
                autoComplete="new-password"
              />
            </Field>
            <Field label={t('fields.confirmPassword')} error={mapPwError(err('confirm'), t)}>
              <Input
                name="confirm"
                type="password"
                required
                minLength={8}
                maxLength={200}
                autoComplete="new-password"
              />
            </Field>
          </SectionCard>
        )}
      </SettingsForm>
    </div>
  )
}

// biome-ignore lint/suspicious/noExplicitAny: next-intl translator type
function mapEmailError(err: string | undefined, t: any): string | undefined {
  if (!err) return undefined
  if (err === 'sameEmail') return t('errors.sameEmail')
  return err
}

// biome-ignore lint/suspicious/noExplicitAny: next-intl translator type
function mapPwError(err: string | undefined, t: any): string | undefined {
  if (!err) return undefined
  if (err === 'passwordMismatch') return t('errors.passwordMismatch')
  return err
}
