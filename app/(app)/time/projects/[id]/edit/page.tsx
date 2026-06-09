import { listActiveClientOptions } from '@/features/clients/queries'
import { updateProjectFormAction } from '@/features/time/actions'
import { ProjectForm } from '@/features/time/components/project-form'
import { getProject } from '@/features/time/queries'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params
  const [t, project, clients] = await Promise.all([
    getTranslations('time'),
    getProject(id),
    listActiveClientOptions(),
  ])

  if (!project) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight">{t('project.editTitle')}</h1>
      <ProjectForm
        mode="edit"
        action={updateProjectFormAction}
        clients={clients}
        initial={project}
      />
    </div>
  )
}
