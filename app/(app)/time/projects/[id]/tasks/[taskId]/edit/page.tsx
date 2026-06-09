import { updateTaskFormAction } from '@/features/time/actions'
import { TaskForm } from '@/features/time/components/task-form'
import { getTask } from '@/features/time/queries'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string; taskId: string }>
}

export default async function EditTaskPage({ params }: PageProps) {
  const { taskId } = await params
  const [t, task] = await Promise.all([getTranslations('time'), getTask(taskId)])
  if (!task) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-3xl font-semibold tracking-tight">{t('taskForm.editTitle')}</h1>
      <TaskForm action={updateTaskFormAction} initial={task} />
    </div>
  )
}
