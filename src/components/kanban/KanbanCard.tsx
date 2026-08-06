import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { ManagerTaskRecord } from '@/hooks/useManagerPortalData'
import { formatDate } from '@/lib/format'
import { taskPriorityLabels } from '@/lib/status-styles'

interface KanbanCardProps {
  task: ManagerTaskRecord
}

export function KanbanCard({ task }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab space-y-2 rounded-lg border border-[#1A2540] bg-[#131C31] p-3 text-sm hover:border-purple-600/30 active:cursor-grabbing"
    >
      <p className="truncate font-medium text-foreground">{task.title}</p>
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
