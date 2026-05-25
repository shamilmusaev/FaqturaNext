import { Chip } from '@/components/ui/chip'
import { getTranslations } from 'next-intl/server'
import type { InvoiceStatus } from '../schema'

const TONE: Record<InvoiceStatus, 'neutral' | 'pos' | 'warn' | 'neg' | 'brand'> = {
  draft: 'neutral',
  sent: 'brand',
  paid: 'pos',
  overdue: 'neg',
  cancelled: 'neutral',
}

export async function InvoiceStatusChip({
  status,
  className,
}: {
  status: InvoiceStatus
  className?: string
}) {
  const t = await getTranslations('invoiceStatus')
  return (
    <Chip tone={TONE[status]} className={className}>
      {t(status)}
    </Chip>
  )
}
