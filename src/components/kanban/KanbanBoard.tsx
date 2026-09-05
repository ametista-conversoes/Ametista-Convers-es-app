import { DndContext, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import type { ManagerTaskRecord } from '@/hooks/useManagerPortalData'
import { useUpdateTaskStatus } from '@/hooks/useManagerPortalData'
import { taskStatusLabels } from '@/lib/status-styles'

const COLUMNS = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const

interface KanbanBoardProps {
  tasks: ManagerTaskRecord[]
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (taskId: string) => void
}

export function KanbanBoard({ tasks, selectMode, selectedIds, onToggleSelect }: KanbanBoardProps) {
  const updateTaskStatus = useUpdateTaskStatus()
  // Mouse: arrasta ao mover um pouquinho (resposta rápida no desktop).
  // Touch: só começa a arrastar depois de segurar ~200ms — assim um
  // toque rápido (swipe) continua rolando o quadro pro lado no celular,
  // em vez de ser interpretado como "arrastar o card".
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  async function handleDragEnd(event: DragEndEvent) {
    if (selectMode) return
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const newStatus = String(over.id)
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    try {
      await updateTaskStatus.mutateAsync({ taskId, status: newStatus })
    } catch {
      // erro já avisado pelo onError do hook
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
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </DndContext>
  )
}
