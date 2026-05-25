import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { InvoiceIcon, MailIcon, PlusIcon } from '@/components/ui/icons'
import { formatMoney } from '@/lib/money'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'
import type { ClientWithStats } from '../queries'

export async function ClientGrid({ clients }: { clients: ClientWithStats[] }) {
  const t = await getTranslations('clients')
  const tStats = await getTranslations('clients.stats')
  const tActions = await getTranslations('clients.actions')

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      {clients.map((c) => {
        const country = (c.address as { country?: string } | null)?.country
        const meta = [c.org_number, country].filter(Boolean).join(' · ')
        const status = c.has_overdue ? (
          <Chip tone="neg" className="whitespace-nowrap">
            {t('overdue')}
          </Chip>
        ) : c.archived_at ? (
          <Chip tone="neutral" className="whitespace-nowrap">
            {t('archived')}
          </Chip>
        ) : null

        return (
          <article
            key={c.id}
            className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-line-1 bg-card transition-colors hover:border-line-2"
          >
            <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
              <div className="flex items-start gap-3.5">
                <Avatar
                  name={c.name}
                  className="h-12 w-12 shrink-0 text-sm sm:h-14 sm:w-14 sm:text-base"
                />
                <div className="min-w-0 flex-1 pt-0.5">
                  <Link
                    href={`/clients/${c.id}` as Route}
                    className="block truncate text-base font-semibold tracking-[-0.01em] hover:underline"
                  >
                    {c.name}
                  </Link>
                  {(meta || c.email) && (
                    <div className="mt-0.5 truncate font-mono text-xs font-normal text-ink/45">
                      {meta || c.email}
                    </div>
                  )}
                </div>
                {status}
              </div>

              <div className="grid grid-cols-2 border-y border-line-1 py-4">
                <Stat label={tStats('revenue')} value={formatMoney(c.revenue_cents, 'SEK')} />
                <Stat
                  label={tStats('outstanding')}
                  value={formatMoney(c.outstanding_cents, 'SEK')}
                  alert={c.outstanding_cents > 0n}
                  divider
                />
              </div>

              <div className="flex min-w-0 items-center gap-2 text-xs text-ink/50">
                <span className="shrink-0">
                  {tStats('invoiceCount', { count: c.invoice_count })}
                </span>
                {c.email && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate font-mono text-[11px]">{c.email}</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 border-t border-line-1 bg-paper-2/60 shadow-[inset_0_6px_8px_-6px_rgba(0,0,0,0.08)]">
              <ActionTile
                href={`/invoices/new?clientId=${c.id}` as Route}
                label={tActions('newInvoice')}
                icon={PlusIcon}
              />
              <ActionTile
                href={`/invoices?clientId=${c.id}` as Route}
                label={tActions('viewInvoices')}
                icon={InvoiceIcon}
                divider
              />
              <ActionTile
                href={(c.email ? `mailto:${c.email}` : '#') as Route}
                label={tActions('message')}
                icon={MailIcon}
                divider
                external={!!c.email}
                disabled={!c.email}
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
  divider,
}: {
  label: string
  value: string
  alert?: boolean
  divider?: boolean
}) {
  return (
    <div
      className={divider ? 'min-w-0 border-l border-line-1 pl-4 sm:pl-5' : 'min-w-0 pr-4 sm:pr-5'}
    >
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink/45">
        {label}
      </div>
      <div
        className={`tnum truncate text-[clamp(1rem,4.4vw,1.35rem)] font-semibold leading-tight tracking-tight sm:text-[22px] ${alert ? 'text-neg' : 'text-ink'}`}
      >
        {value}
      </div>
    </div>
  )
}

function ActionTile({
  href,
  label,
  icon: Icon,
  divider,
  external,
  disabled,
}: {
  href: Route
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  divider?: boolean
  external?: boolean
  disabled?: boolean
}) {
  const className = `inline-flex min-h-11 items-center justify-center gap-1.5 px-3 py-3 text-center text-xs font-medium text-ink/70 transition-colors hover:bg-brand/10 hover:text-brand sm:text-sm ${divider ? 'border-l border-line-1' : ''} ${disabled ? 'pointer-events-none opacity-45' : ''}`
  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
    )
  }
  if (external) {
    return (
      <a href={href as unknown as string} className={className}>
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </Link>
  )
}
