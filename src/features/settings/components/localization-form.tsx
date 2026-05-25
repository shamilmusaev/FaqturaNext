'use client'

import { LocaleSwitcher } from '@/components/chrome/locale-switcher'
import type { Locale } from '@/i18n/config'
import { cn } from '@/lib/cn'
import { useTranslations } from 'next-intl'
import { updateLocalizationAction } from '../actions'
import type { Organization } from '../queries'
import { Field, SectionCard } from './section-card'
import { SettingsForm } from './settings-form'

const brandLocales = ['sv-SE', 'en-US', 'en-GB', 'nb-NO', 'da-DK', 'fi-FI'] as const

interface Props {
  org: Organization
  uiLocale: Locale
  readOnly: boolean
}

export function LocalizationForm({ org, uiLocale, readOnly }: Props) {
  const t = useTranslations('settings.localization')

  return (
    <div className="flex flex-col gap-6">
      <SectionCard title={t('uiTitle')} subtitle={t('uiSubtitle')}>
        <Field label={t('uiTitle')}>
          <div className="flex items-center gap-2">
            <LocaleSwitcher current={uiLocale} />
          </div>
        </Field>
      </SectionCard>

      <SettingsForm action={updateLocalizationAction} readOnly={readOnly}>
        {({ err }) => (
          <SectionCard title={t('brandTitle')} subtitle={t('brandSubtitle')}>
            <Field label={t('brandTitle')} error={err('locale')}>
              <div className="flex flex-col gap-1.5">
                {brandLocales.map((loc) => (
                  <LocaleRow key={loc} value={loc} defaultChecked={org.locale === loc} t={t} />
                ))}
              </div>
            </Field>
          </SectionCard>
        )}
      </SettingsForm>
    </div>
  )
}

function LocaleRow({
  value,
  defaultChecked,
  t,
}: {
  value: string
  defaultChecked: boolean
  // biome-ignore lint/suspicious/noExplicitAny: i18n hook type
  t: any
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="locale"
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        className={cn(
          'flex items-center justify-between gap-3 h-12 px-4 rounded-[14px] border transition-colors',
          'border-line-1 bg-card text-ink/80 hover:bg-paper-2',
          'peer-checked:border-ink peer-checked:bg-ink/[0.04] peer-checked:text-ink',
        )}
      >
        <span className="text-sm font-medium">{t(`locales.${value}`)}</span>
        <span className="font-mono text-xs text-ink/40">{value}</span>
      </span>
    </label>
  )
}
