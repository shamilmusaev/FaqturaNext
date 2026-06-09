'use client'

import { cn } from '@/lib/cn'
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { reorderTaskAction } from '../actions'
import { formatHM, formatRange } from '../duration'
import type { TaskRow } from '../queries'
import type { TaskStatus } from '../schema'
import { TaskDeleteButton } from './task-delete-button'

interface Props {
  projectId: string
  tasks: TaskRow[]
}

const COLUMNS: { status: TaskStatus; key: 'todo' | 'inProgress' | 'done' }[] = [
  { status: 'todo', key: 'todo' },
  { status: 'in_progress', key: 'inProgress' },
  { status: 'done', key: 'done' },
]
const STATUSES = COLUMNS.map((c) => c.status)

type Columns = Record<TaskStatus, string[]>

function groupIds(tasks: TaskRow[]): Columns {
  const cols: Columns = { todo: [], in_progress: [], done: [] }
  for (const task of tasks) cols[task.status as TaskStatus]?.push(task.id)
  return cols
}

export function TaskBoardDnd({ projectId, tasks }: Props) {
  const t = useTranslations('time.board')
  const [tasksById, setTasksById] = useState<Record<string, TaskRow>>(() =>
    Object.fromEntries(tasks.map((task) => [task.id, task])),
  )
  const [columns, setColumns] = useState<Columns>(() => groupIds(tasks))
  const [activeId, setActiveId] = useState<string | null>(null)
  const snapshot = useRef<{ columns: Columns; tasksById: Record<string, TaskRow> } | null>(null)

  // Re-sync from server data when the tasks prop changes (e.g. a task was added
  // or edited elsewhere and the route revalidated). Skip while a drag is in
  // flight so we never clobber the optimistic move mid-gesture.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on `tasks` only
  useEffect(() => {
    if (activeId) return
    setTasksById(Object.fromEntries(tasks.map((task) => [task.id, task])))
    setColumns(groupIds(tasks))
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function findContainer(id: string): TaskStatus | undefined {
    if (STATUSES.includes(id as TaskStatus)) return id as TaskStatus
    return STATUSES.find((status) => columns[status].includes(id))
  }

  function handleDragStart(event: DragStartEvent) {
    snapshot.current = { columns, tasksById }
    setActiveId(String(event.active.id))
  }

  // Live move between columns while dragging, so cards make room in real time.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    const from = findContainer(activeId)
    const to = findContainer(overId)
    if (!from || !to || from === to) return

    setColumns((prev) => {
      const fromItems = prev[from]
      const toItems = prev[to]
      const overIndex = toItems.indexOf(overId)
      const insertAt = overIndex >= 0 ? overIndex : toItems.length
      return {
        ...prev,
        [from]: fromItems.filter((id) => id !== activeId),
        [to]: [...toItems.slice(0, insertAt), activeId, ...toItems.slice(insertAt)],
      }
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const activeId = String(active.id)
    setActiveId(null)
    if (!over) return

    const container = findContainer(activeId)
    if (!container) return

    const items = columns[container]
    const oldIndex = items.indexOf(activeId)
    const overId = String(over.id)
    // Dropping on the column header (overId is a status) appends to the end;
    // dropping on a card targets that card's slot.
    const newIndex = STATUSES.includes(overId as TaskStatus) ? items.length : items.indexOf(overId)
    const ordered =
      oldIndex !== newIndex && newIndex >= 0 ? arrayMove(items, oldIndex, newIndex) : items

    const nextColumns = { ...columns, [container]: ordered }
    setColumns(nextColumns)
    setTasksById((prev) => {
      const current = prev[activeId]
      if (!current) return prev
      return { ...prev, [activeId]: { ...current, status: container } }
    })

    const res = await reorderTaskAction(activeId, container, ordered)
    if (res?.error && snapshot.current) {
      setColumns(snapshot.current.columns)
      setTasksById(snapshot.current.tasksById)
    }
  }

  const activeTask = activeId ? tasksById[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map(({ status, key }) => (
          <Column
            key={status}
            status={status}
            label={t(key)}
            emptyLabel={t('emptyColumn')}
            taskIds={columns[status]}
            tasksById={tasksById}
            projectId={projectId}
            editLabel={t('edit')}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {activeTask ? <TaskCardBody task={activeTask} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function Column({
  status,
  label,
  emptyLabel,
  taskIds,
  tasksById,
  projectId,
  editLabel,
}: {
  status: TaskStatus
  label: string
  emptyLabel: string
  taskIds: string[]
  tasksById: Record<string, TaskRow>
  projectId: string
  editLabel: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col gap-3 rounded-[20px] p-3 transition-colors',
        isOver ? 'bg-brand/10 ring-2 ring-brand/40' : 'bg-paper-2/60',
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold">{label}</span>
        <span className="tnum text-xs text-ink/40">{taskIds.length}</span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {taskIds.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-ink/35">{emptyLabel}</p>
        ) : (
          taskIds.map((id) => {
            const task = tasksById[id]
            if (!task) return null
            return (
              <SortableTaskCard key={id} task={task} projectId={projectId} editLabel={editLabel} />
            )
          })
        )}
      </SortableContext>
    </div>
  )
}

function SortableTaskCard({
  task,
  projectId,
  editLabel,
}: {
  task: TaskRow
  projectId: string
  editLabel: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none select-none active:cursor-grabbing"
    >
      <TaskCardBody task={task} projectId={projectId} editLabel={editLabel} />
    </div>
  )
}

function TaskCardBody({
  task,
  projectId,
  editLabel,
  dragging,
}: {
  task: TaskRow
  projectId?: string
  editLabel?: string
  dragging?: boolean
}) {
  const range = formatRange(task.est_min_minutes, task.est_max_minutes)
  const done = task.status === 'done'
  return (
    <div
      className={cn(
        'rounded-[16px] border border-line-1 bg-card p-3 flex flex-col gap-2',
        dragging && 'shadow-[0_12px_28px_-8px_rgba(0,0,0,0.25)] rotate-1',
      )}
    >
      <span className={cn('text-sm font-medium', done && 'text-ink/50 line-through')}>
        {task.name}
      </span>
      <div className="flex items-center gap-2 text-xs text-ink/55">
        {range && <span className="tnum rounded-full bg-paper-2 px-2 py-0.5">{range}</span>}
        {task.actual_minutes != null && (
          <span className="tnum text-pos">{formatHM(task.actual_minutes)}</span>
        )}
      </div>
      {projectId && (
        <div className="flex items-center justify-end">
          {/* Only the buttons block the drag gesture — the rest of this row stays grabbable. */}
          <div className="flex w-fit items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
            <Link
              href={`/time/projects/${projectId}/tasks/${task.id}/edit` as Route}
              className="text-xs text-ink/50 hover:text-ink px-1"
            >
              {editLabel}
            </Link>
            <TaskDeleteButton id={task.id} />
          </div>
        </div>
      )}
    </div>
  )
}
