import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Pencil } from 'lucide-react'
import { KanbanTaskFormDialog } from '@/components/kanban/KanbanTaskFormDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import type { ManagerTaskRecord } from '@/hooks/useManagerPortalData'
import { useDeleteManagerTask } from '@/hooks/useManagerPortalData'
import { formatDate, getTodayIsoDate } from '@/lib/format'
import { taskPriorityLabels } from '@/lib/status-styles'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  task: ManagerTaskRecord
  deleteMode?: boolean
}

export function KanbanCard({ task, deleteMode }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: deleteMode,
  })
  const deleteTask = useDeleteManagerTask()

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined

  const isOverdue = task.status !== 'done' && !!task.due_date && task.due_date < getTodayIsoDate()

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...(deleteMode ? {} : listeners)}
      {...(deleteMode ? {} : attributes)}
      className={cn(
        'space-y-2 rounded-lg border border-[#1A2540] bg-[#131C31] p-3 text-sm hover:border-purple-600/30',
        !deleteMode && 'cursor-grab active:cursor-grabbing',
        isOverdue && 'opacity-60 grayscale-[0.5]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate font-medium text-foreground">{task.title}</p>
        <span className="flex shrink-0 items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
          <KanbanTaskFormDialog
            task={task}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                aria-label={`Editar ${task.title}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            }
          />
          {deleteMode && (
            <DeleteItemButton
              label={`a tarefa "${task.title}"`}
              onDelete={() => deleteTask.mutateAsync(task.id)}
              className="h-6 w-6 shrink-0"
            />
          )}
        </span>
      </div>
      <p className="truncate text-xs text-muted-foreground">{task.client?.name ?? 'Sem cliente'}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge className="border-[#1A2540] bg-secondary/50 text-muted-foreground">
          {taskPriorityLabels[task.priority] ?? task.priority}
        </Badge>
        {task.due_date && <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>}
      </div>
    </Card>
  )
}
