import { useRef } from 'react'
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
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
  // Evita apagar duas vezes: onDragOver dispara de novo enquanto o card
  // continua parado em cima da lixeira. Reseta a cada novo arrasto.
  const deletedInThisDragRef = useRef(false)
  // Mouse: arrasta ao mover um pouquinho (resposta rápida no desktop).
  // Touch: só começa a arrastar depois de segurar ~200ms — assim um
  // toque rápido (swipe) continua rolando o quadro pro lado no celular,
  // em vez de ser interpretado como "arrastar o card".
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  function handleDragStart() {
    deletedInThisDragRef.current = false
  }

  // Apaga assim que o card ENTRA na lixeira durante o arrasto — não
  // espera o "soltar" (onDragEnd), que dependia de acertar exatamente a
  // faixa fina da lixeira no instante do drop.
  async function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (over?.id !== TRASH_DROPPABLE_ID || deletedInThisDragRef.current) return

    deletedInThisDragRef.current = true
    try {
      await deleteTask.mutateAsync(String(active.id))
    } catch {
      toast.error('Não foi possível apagar a tarefa.')
      deletedInThisDragRef.current = false
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || deletedInThisDragRef.current) return

    const taskId = String(active.id)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const newStatus = String(over.id)
    if (task.status === newStatus) return

    try {
      await updateTaskStatus.mutateAsync({ taskId, status: newStatus })
    } catch {
      toast.error('Não foi possível mover a tarefa.')
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
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
      {deleteMode && <TrashDropZone />}
    </DndContext>
  )
}
