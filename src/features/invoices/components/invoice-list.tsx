import { formatMoney } from '@/lib/money'
import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import type { InvoiceListItem } from '../queries'
import { InvoiceStatusChip } from './invoice-status-chip'

export async function InvoiceList({ invoices }: { invoices: InvoiceListItem[] }) {
  const tFields = await getTranslations('invoices.fields')
  return (
    <>
      <div className="hidden md:block rounded-[24px] border border-line-1 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-ink/60 text-xs uppercase tracking-wide">
            <tr className="border-b border-line-1">
              <th className="text-left font-medium px-6 py-3">{tFields('number')}</th>
              <th className="text-left font-medium px-6 py-3">{tFields('client')}</th>
              <th className="text-left font-medium px-6 py-3">{tFields('dueAt')}</th>
              <th className="text-right font-medium px-6 py-3">{tFields('total')}</th>
              <th className="text-right font-medium px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-line-1 last:border-0 hover:bg-paper/50">
                <td className="px-6 py-3 font-mono text-xs">
                  <Link href={`/invoices/${inv.id}` as Route} className="hover:underline">
                    {inv.number}
                  </Link>
                </td>
                <td className="px-6 py-3">{inv.client?.name ?? '—'}</td>
                <td className="px-6 py-3 text-ink/70">{inv.due_at}</td>
                <td className="px-6 py-3 text-right tnum font-mono">
                  {formatMoney(inv.total_cents, (inv.currency || 'SEK') as 'SEK')}
                </td>
                <td className="px-6 py-3 text-right">
                  <InvoiceStatusChip status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden flex flex-col gap-3">
        {invoices.map((inv) => (
          <Link
            key={inv.id}
            href={`/invoices/${inv.id}` as Route}
            className="block rounded-[24px] border border-line-1 bg-card p-4 hover:bg-paper/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-xs text-ink/60">{inv.number}</div>
                <div className="font-medium">{inv.client?.name ?? '—'}</div>
                <div className="mt-1 text-sm text-ink/60">{inv.due_at}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <InvoiceStatusChip status={inv.status} />
                <div className="tnum font-mono font-semibold">
                  {formatMoney(inv.total_cents, (inv.currency || 'SEK') as 'SEK')}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
