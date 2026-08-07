import { DndContext, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { toast } from 'sonner'
import { KanbanColumn } from './KanbanColumn'
import { TRASH_DROPPABLE_ID, TrashDropZone } from './TrashDropZone'
import type { ManagerTaskRecord } from '@/hooks/useManagerPortalData'
import { useDeleteManagerTask, useUpdateTaskStatus } from '@/hooks/useManagerPortalData'
import { taskStatusLabels } from '@/lib/status-styles'

const COLUMNS = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const

interface KanbanBoardProps {
  tasks: ManagerTaskRecord[]
  deleteMode?: boolean
}

export function KanbanBoard({ tasks, deleteMode }: KanbanBoardProps) {
  const updateTaskStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteManagerTask()
  // Mouse: arrasta ao mover um pouquinho (resposta rápida no desktop).
  // Touch: só começa a arrastar depois de segurar ~200ms — assim um
  // toque rápido (swipe) continua rolando o quadro pro lado no celular,
  // em vez de ser interpretado como "arrastar o card".
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    if (over.id === TRASH_DROPPABLE_ID) {
      try {
        await deleteTask.mutateAsync(taskId)
      } catch {
        toast.error('Não foi possível apagar a tarefa.')
      }
      return
    }

    const newStatus = String(over.id)
    if (task.status === newStatus) return

    try {
      await updateTaskStatus.mutateAsync({ taskId, status: newStatus })
    } catch {
      toast.error('Não foi possível mover a tarefa.')
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            id={status}
            title={taskStatusLabels[status]}
            tasks={tasks.filter((t) => t.status === status)}
          />
        ))}
        {deleteMode && <TrashDropZone />}
      </div>
    </DndContext>
  )
}
