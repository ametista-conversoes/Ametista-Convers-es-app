import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { toast } from 'sonner'
import { KanbanColumn } from './KanbanColumn'
import type { ManagerTaskRecord } from '@/hooks/useManagerPortalData'
import { useUpdateTaskStatus } from '@/hooks/useManagerPortalData'
import { taskStatusLabels } from '@/lib/status-styles'

const COLUMNS = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const

interface KanbanBoardProps {
  tasks: ManagerTaskRecord[]
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const updateTaskStatus = useUpdateTaskStatus()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const newStatus = String(over.id)
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

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
      </div>
    </DndContext>
  )
}
