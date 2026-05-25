'use client'

import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { updateCompanyAction } from '../actions'
import type { Organization } from '../queries'
import { Field, SectionCard } from './section-card'
import { SettingsForm } from './settings-form'

interface Props {
  org: Organization
  readOnly: boolean
}

export function CompanyForm({ org, readOnly }: Props) {
  const t = useTranslations('settings.company')
  return (
    <SettingsForm action={updateCompanyAction} readOnly={readOnly}>
      {({ err }) => (
        <>
          <SectionCard title={t('identityTitle')} subtitle={t('identitySubtitle')}>
            <Field label={t('fields.name')} error={err('name')}>
              <Input
                name="name"
                defaultValue={org.name}
                required
                maxLength={200}
                autoComplete="organization"
              />
            </Field>
            <div className="grid md:grid-cols-2 gap-5">
              <Field label={t('fields.orgNumber')} error={err('org_number')} optional>
                <Input
                  name="org_number"
                  defaultValue={org.org_number ?? ''}
                  placeholder={t('placeholders.orgNumber')}
                  maxLength={50}
                />
              </Field>
              <Field label={t('fields.vatNumber')} error={err('vat_number')} optional>
                <Input
                  name="vat_number"
                  defaultValue={org.vat_number ?? ''}
                  placeholder={t('placeholders.vatNumber')}
                  maxLength={50}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title={t('addressTitle')} subtitle={t('addressSubtitle')}>
            <Field label={t('fields.street')} optional>
              <Input
                name="address.street"
                defaultValue={org.address?.street ?? ''}
                autoComplete="street-address"
              />
            </Field>
            <div className="grid md:grid-cols-[160px_1fr] gap-5">
              <Field label={t('fields.postal')} optional>
                <Input
                  name="address.postal"
                  defaultValue={org.address?.postal ?? ''}
                  autoComplete="postal-code"
                />
              </Field>
              <Field label={t('fields.city')} optional>
                <Input
                  name="address.city"
                  defaultValue={org.address?.city ?? ''}
                  autoComplete="address-level2"
                />
              </Field>
            </div>
            <Field label={t('fields.country')} optional>
              <Input
                name="address.country"
                defaultValue={org.address?.country ?? ''}
                placeholder={t('placeholders.country')}
                autoComplete="country-name"
              />
            </Field>
          </SectionCard>
        </>
      )}
    </SettingsForm>
  )
}
