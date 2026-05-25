'use client'

import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { updatePaymentAction } from '../actions'
import type { Organization } from '../queries'
import { Field, SectionCard } from './section-card'
import { SettingsForm } from './settings-form'

interface Props {
  org: Organization
  readOnly: boolean
}

export function PaymentForm({ org, readOnly }: Props) {
  const t = useTranslations('settings.payment')
  return (
    <SettingsForm action={updatePaymentAction} readOnly={readOnly}>
      {({ err }) => (
        <SectionCard title={t('title')} subtitle={t('subtitle')}>
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
