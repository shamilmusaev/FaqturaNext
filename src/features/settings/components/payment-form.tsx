'use client'

import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { updatePaymentAction } from '../actions'
import { SWEDISH_BANKS, initialBankSelection } from '../banks'
import type { Organization } from '../queries'
import { Field, SectionCard } from './section-card'
import { SettingsForm } from './settings-form'

interface Props {
  org: Organization
  readOnly: boolean
}

// Shared <select> styling: custom chevron with comfortable right padding so the
// arrow never crowds the border or the text.
const SELECT_CLASS =
  'h-11 w-full appearance-none rounded-[12px] border border-line-1 bg-card pl-3 pr-9 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand disabled:opacity-50'
const SELECT_STYLE: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b8579' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '16px',
}
const OTHER = '__other__'

export function PaymentForm({ org, readOnly }: Props) {
  const t = useTranslations('settings.payment')
  return (
    <SettingsForm action={updatePaymentAction} readOnly={readOnly}>
      {({ err }) => (
        <SectionCard title={t('title')} subtitle={t('subtitle')}>
          <Field label={t('fields.bank')} error={err('bank_name')} optional>
            <BankField bankName={org.bank_name} otherLabel={t('bankOther')} t={t} />
          </Field>
          <Field label={t('fields.iban')} hint={t('hint')} error={err('iban')} optional>
            <Input
              name="iban"
              defaultValue={org.iban ?? ''}
              placeholder={t('placeholders.iban')}
              className="font-mono tracking-wide"
            />
          </Field>
          <div className="grid md:grid-cols-2 gap-5">
            <Field label={t('fields.bankgiro')} error={err('bankgiro')} optional>
              <Input
                name="bankgiro"
                defaultValue={org.bankgiro ?? ''}
                placeholder={t('placeholders.bankgiro')}
                className="font-mono"
              />
            </Field>
            <Field label={t('fields.plusgiro')} error={err('plusgiro')} optional>
              <Input
                name="plusgiro"
                defaultValue={org.plusgiro ?? ''}
                placeholder={t('placeholders.plusgiro')}
                className="font-mono"
              />
            </Field>
          </div>
          <Field label={t('fields.swish')} error={err('swish_number')} optional>
            <Input
              name="swish_number"
              defaultValue={org.swish_number ?? ''}
              placeholder={t('placeholders.swish')}
              className="font-mono"
            />
          </Field>
        </SectionCard>
      )}
    </SettingsForm>
  )
}

function BankField({
  bankName,
  otherLabel,
  t,
}: {
  bankName: string | null
  otherLabel: string
  t: (key: string) => string
}) {
  const init = initialBankSelection(bankName)
  const [isOther, setIsOther] = useState(init.isOther)

  return (
    <div className="grid gap-2">
      <select
        // When "Other" is chosen the free-text input below owns `bank_name`, so
        // the select must not also submit its sentinel value.
        name={isOther ? undefined : 'bank_name'}
        defaultValue={init.selected}
        className={SELECT_CLASS}
        style={SELECT_STYLE}
        onChange={(e) => setIsOther(e.target.value === OTHER)}
      >
        <option value="">{t('bankNone')}</option>
        {SWEDISH_BANKS.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
        <option value={OTHER}>{otherLabel}</option>
      </select>
      {isOther && (
        <Input
          name="bank_name"
          defaultValue={init.custom}
          placeholder={t('placeholders.bank')}
          autoFocus
        />
      )}
    </div>
  )
}
