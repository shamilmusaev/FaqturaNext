import type { TaskRow } from '../queries'
import { TaskBoardDnd } from './task-board-dnd'

interface Props {
  projectId: string
  tasks: TaskRow[]
}

export function TaskBoard({ projectId, tasks }: Props) {
  return <TaskBoardDnd projectId={projectId} tasks={tasks} />
}
