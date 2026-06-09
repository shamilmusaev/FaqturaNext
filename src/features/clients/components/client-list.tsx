import { Chip } from '@/components/ui/chip'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { ClientRow } from '../queries'

export async function ClientList({ clients }: { clients: ClientRow[] }) {
  const t = await getTranslations('clients')
  return (
    <>
      <div className="hidden md:block">
        <DesktopTable
          clients={clients}
          archivedLabel={t('archived')}
          fieldsT={{
            name: t('fields.name'),
            email: t('fields.email'),
            vat: t('fields.vatNumber'),
          }}
        />
      </div>
      <div className="md:hidden flex flex-col gap-3">
        {clients.map((c) => (
          <MobileCard key={c.id} client={c} archivedLabel={t('archived')} />
        ))}
      </div>
    </>
  )
}

function DesktopTable({
  clients,
  archivedLabel,
  fieldsT,
}: {
  clients: ClientRow[]
  archivedLabel: string
  fieldsT: { name: string; email: string; vat: string }
}) {
  return (
    <div className="rounded-[24px] border border-line-1 bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-ink/60 text-xs uppercase tracking-wide">
          <tr className="border-b border-line-1">
            <th className="text-left font-medium px-6 py-3">{fieldsT.name}</th>
            <th className="text-left font-medium px-6 py-3">{fieldsT.email}</th>
            <th className="text-left font-medium px-6 py-3">{fieldsT.vat}</th>
            <th className="text-right font-medium px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-b border-line-1 last:border-0 hover:bg-paper/50">
              <td className="px-6 py-3">
                <Link href={`/clients/${c.id}` as Route} className="font-medium hover:underline">
                  {c.name}
                </Link>
              </td>
              <td className="px-6 py-3 text-ink/70">{c.email ?? 'N/A'}</td>
              <td className="px-6 py-3 text-ink/70 text-xs">{c.vat_number ?? 'N/A'}</td>
              <td className="px-6 py-3 text-right">
                {c.archived_at && <Chip tone="neutral">{archivedLabel}</Chip>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileCard({ client, archivedLabel }: { client: ClientRow; archivedLabel: string }) {
  return (
    <Link
      href={`/clients/${client.id}` as Route}
      className="block rounded-[24px] border border-line-1 bg-card p-4 hover:bg-paper/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">{client.name}</div>
          {client.email && <div className="text-sm text-ink/60 truncate">{client.email}</div>}
        </div>
        {client.archived_at && <Chip tone="neutral">{archivedLabel}</Chip>}
      </div>
    </Link>
  )
}
