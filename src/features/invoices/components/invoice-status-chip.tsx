import { Chip } from '@/components/ui/chip'
import { getTranslations } from 'next-intl/server'
import type { InvoiceStatus } from '../schema'
import { STATUS_TONE } from '../status-tone'

export async function InvoiceStatusChip({
  status,
  className,
}: {
  status: InvoiceStatus
  className?: string
}) {
  const t = await getTranslations('invoiceStatus')
  return (
    <Chip tone={STATUS_TONE[status]} className={className}>
      {t(status)}
    </Chip>
  )
}
