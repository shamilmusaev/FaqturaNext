'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { useTranslations } from 'next-intl'
import { updateInvoicingAction } from '../actions'
import type { Organization } from '../queries'
import { Field, SectionCard } from './section-card'
import { SettingsForm } from './settings-form'

const currencies = ['SEK', 'EUR', 'USD', 'NOK', 'DKK', 'GBP'] as const

interface Props {
  org: Organization
  readOnly: boolean
}

export function InvoicingForm({ org, readOnly }: Props) {
  const t = useTranslations('settings.invoicing')
  return (
    <SettingsForm action={updateInvoicingAction} readOnly={readOnly}>
      {({ err }) => (
        <SectionCard title={t('title')} subtitle={t('subtitle')}>
          <div className="grid md:grid-cols-2 gap-5">
            <Field
              label={t('fields.vatRate')}
              hint={t('hints.vatRate')}
              error={err('default_vat_rate')}
            >
              <SuffixInput
                name="default_vat_rate"
                type="number"
                step="0.5"
                min={0}
                max={100}
                defaultValue={String(org.default_vat_rate)}
                suffix={t('units.percent')}
                required
              />
            </Field>
            <Field
              label={t('fields.paymentTerms')}
              hint={t('hints.paymentTerms')}
              error={err('default_payment_terms_days')}
            >
              <SuffixInput
                name="default_payment_terms_days"
                type="number"
                step={1}
                min={0}
                max={365}
                defaultValue={String(org.default_payment_terms_days)}
                suffix={t('units.days')}
                required
              />
            </Field>
          </div>

          <Field
            label={t('fields.numberTemplate')}
            hint={t('hints.numberTemplate')}
            error={err('invoice_number_template')}
          >
            <Input
              name="invoice_number_template"
              defaultValue={org.invoice_number_template}
              className="font-mono"
              required
              maxLength={50}
            />
          </Field>

          <Field
            label={t('fields.currency')}
            hint={t('hints.currency')}
            error={err('currency')}
          >
            <div className="flex flex-wrap gap-2">
              {currencies.map((c) => (
                <CurrencyChip key={c} value={c} defaultChecked={org.currency === c} />
              ))}
            </div>
          </Field>
        </SectionCard>
      )}
    </SettingsForm>
  )
}

function SuffixInput({
  suffix,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { suffix: string }) {
  return (
    <div className="relative">
      <input
        {...props}
        className={cn(
          'flex h-11 w-full rounded-[12px] border border-line-1 bg-card pl-3 pr-14 text-[15px]',
          'placeholder:text-ink/40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
          'disabled:opacity-50',
          className,
        )}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink/45 pointer-events-none">
        {suffix}
      </span>
    </div>
  )
}

function CurrencyChip({ value, defaultChecked }: { value: string; defaultChecked: boolean }) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="currency"
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        className={cn(
          'inline-flex items-center justify-center h-10 min-w-[64px] px-4 rounded-full text-sm font-medium border transition-colors',
          'border-line-1 bg-card text-ink/70 hover:text-ink hover:bg-paper-2',
          'peer-checked:bg-ink peer-checked:text-white peer-checked:border-ink',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
        )}
      >
        {value}
      </span>
    </label>
  )
}
