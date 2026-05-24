import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { ClientArchiveButton } from '@/features/clients/components/client-archive-button'
import { getClient } from '@/features/clients/queries'
import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()
  const t = await getTranslations('clients')

  const addr = client.address
  const addressLines = [
    addr?.street,
    [addr?.postal, addr?.city].filter(Boolean).join(' '),
    addr?.country,
  ].filter((line): line is string => Boolean(line && line.length > 0))

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link href={'/clients' as Route} className="text-sm text-ink/60 hover:text-ink">
          ← {t('back')}
        </Link>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{client.name}</h1>
          {client.archived_at && (
            <div className="mt-2">
              <Chip tone="neutral">{t('archived')}</Chip>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/clients/${client.id}/edit` as Route}>
            <Button variant="secondary">{t('edit')}</Button>
          </Link>
          <ClientArchiveButton id={client.id} archived={Boolean(client.archived_at)} />
        </div>
      </div>

      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        {client.email && (
          <>
            <dt className="text-ink/60">{t('fields.email')}</dt>
            <dd>{client.email}</dd>
          </>
        )}
        {client.org_number && (
          <>
            <dt className="text-ink/60">{t('fields.orgNumber')}</dt>
            <dd className="font-mono">{client.org_number}</dd>
          </>
        )}
        {client.vat_number && (
          <>
            <dt className="text-ink/60">{t('fields.vatNumber')}</dt>
            <dd className="font-mono">{client.vat_number}</dd>
          </>
        )}
        {addressLines.length > 0 && (
          <>
            <dt className="text-ink/60">Address</dt>
            <dd>
              {addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </dd>
          </>
        )}
        {client.notes && (
          <>
            <dt className="text-ink/60">{t('fields.notes')}</dt>
            <dd className="whitespace-pre-wrap">{client.notes}</dd>
          </>
        )}
      </dl>
    </div>
  )
}
