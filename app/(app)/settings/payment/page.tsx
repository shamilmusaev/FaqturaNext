import { PaymentForm } from '@/features/settings/components/payment-form'
import { ReadOnlyBanner } from '@/features/settings/components/read-only-banner'
import { getCurrentOrganization } from '@/features/settings/queries'
import { requireUser } from '@/lib/auth'

export default async function SettingsPaymentPage() {
  const [{ role }, org] = await Promise.all([requireUser(), getCurrentOrganization()])
  const readOnly = role !== 'owner' && role !== 'admin'
  return (
    <>
      <ReadOnlyBanner visible={readOnly} />
      <PaymentForm org={org} readOnly={readOnly} />
    </>
  )
}
