import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { formatMoney } from '@/lib/money'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { ClientWithStats } from '../queries'

export async function ClientGrid({ clients }: { clients: ClientWithStats[] }) {
  const t = await getTranslations('clients')
  const tStats = await getTranslations('clients.stats')
  const tActions = await getTranslations('clients.actions')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((c) => {
        const country = (c.address as { country?: string } | null)?.country
        const meta = [c.org_number, country].filter(Boolean).join(' · ')
        return (
          <article
            key={c.id}
            className="rounded-[24px] border border-line-1 bg-card overflow-hidden flex flex-col"
          >
            <div className="p-6 flex flex-col gap-5 flex-1">
              <div className="flex items-center gap-3.5">
                <Avatar name={c.name} className="h-14 w-14 text-base" />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/clients/${c.id}` as Route}
                    className="block text-base font-semibold truncate hover:underline"
                  >
                    {c.name}
                  </Link>
                  <div className="text-xs text-ink/50 font-mono truncate">
                    {meta || c.email || '—'}
                  </div>
                </div>
                {c.has_overdue && <Chip tone="neg">{t('overdue')}</Chip>}
                {c.archived_at && !c.has_overdue && <Chip tone="neutral">{t('archived')}</Chip>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Stat label={tStats('revenue')} value={formatMoney(c.revenue_cents, 'SEK')} />
                <Stat
                  label={tStats('outstanding')}
                  value={formatMoney(c.outstanding_cents, 'SEK')}
                  alert={c.outstanding_cents > 0n}
                />
              </div>

              <div className="text-xs text-ink/50">
                {tStats('invoiceCount', { count: c.invoice_count })}
                {c.email ? ` · ${c.email}` : ''}
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-line-1 bg-paper">
              <ActionTile
                href={`/invoices/new?clientId=${c.id}` as Route}
                label={tActions('newInvoice')}
              />
              <ActionTile
                href={`/invoices?clientId=${c.id}` as Route}
                label={tActions('viewInvoices')}
                divider
              />
              <ActionTile
                href={(c.email ? `mailto:${c.email}` : '#') as Route}
                label={tActions('message')}
                divider
                external={!!c.email}
              />
            </div>
          </article>
        )
      })}
    </div>
  )
}

function Stat({
  label,
  value,
  alert,
}: {
  label: string
  value: string
  alert?: boolean
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-1">{label}</div>
      <div
        className={`text-[22px] font-semibold tracking-tight tnum font-mono ${alert ? 'text-neg' : ''}`}
      >
        {value}
      </div>
    </div>
  )
}

function ActionTile({
  href,
  label,
  divider,
  external,
}: {
  href: Route
  label: string
  divider?: boolean
  external?: boolean
}) {
  const className = `px-4 py-3.5 text-sm font-medium text-ink/70 text-center hover:bg-paper/60 hover:text-ink transition-colors ${divider ? 'border-l border-line-1' : ''}`
  if (external) {
    return (
      <a href={href as unknown as string} className={className}>
        {label}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  )
}
