import { updateTimeEntryFormAction } from '@/features/time/actions'
import { TimeEntryForm } from '@/features/time/components/time-entry-form'
import { getTimeEntry, listCategoryOptions, listProjectOptions } from '@/features/time/queries'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditEntryPage({ params }: PageProps) {
  const { id } = await params
  const [t, entry, projects, categories] = await Promise.all([
    getTranslations('time'),
    getTimeEntry(id),
    listProjectOptions(),
    listCategoryOptions(),
  ])

  if (!entry) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight">{t('log.editTitle')}</h1>
      <TimeEntryForm
        action={updateTimeEntryFormAction}
        projects={projects}
        categories={categories}
        initial={entry}
      />
    </div>
  )
}
