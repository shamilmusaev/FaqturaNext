import { listActiveClientOptions } from '@/features/clients/queries'
import { createProjectFormAction } from '@/features/time/actions'
import { ProjectForm } from '@/features/time/components/project-form'
import { getTranslations } from 'next-intl/server'

export default async function NewProjectPage() {
  const [t, clients] = await Promise.all([getTranslations('time'), listActiveClientOptions()])

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight">{t('newProject')}</h1>
      {clients.length === 0 ? (
        <p className="text-ink/60">{t('project.needClientFirst')}</p>
      ) : (
        <ProjectForm mode="create" action={createProjectFormAction} clients={clients} />
      )}
    </div>
  )
}
