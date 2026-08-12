import { Pencil } from 'lucide-react'
import { KanbanTaskFormDialog } from '@/components/kanban/KanbanTaskFormDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import type { ManagerTaskRecord } from '@/hooks/useManagerPortalData'
import { useDeleteManagerTask, useUpdateTaskStatus } from '@/hooks/useManagerPortalData'
import { formatDate, getTodayIsoDate } from '@/lib/format'
import { taskPriorityLabels, taskStatusLabels, taskStatusStyles } from '@/lib/status-styles'
import { cn } from '@/lib/utils'

const CHANGEABLE_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'] as const

interface ManagerTaskRowProps {
  task: ManagerTaskRecord
  showClientName?: boolean
  deleteMode?: boolean
}

/** Linha de tarefa pra aba "Tarefas do Cliente" (Fase 6.5.3) — mesmo
 * tratamento visual de atraso do Kanban (`KanbanCard.tsx`), mas em
 * lista simples em vez de card arrastável (não faz sentido arrastar
 * aqui, não tem colunas). */
export function ManagerTaskRow({ task, showClientName, deleteMode }: ManagerTaskRowProps) {
  const updateStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteManagerTask()

  const isOverdue = task.status !== 'done' && !!task.due_date && task.due_date < getTodayIsoDate()

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2',
        isOverdue && 'opacity-60 grayscale-[0.5]',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
        <p className="text-xs text-muted-foreground">
          {showClientName && (task.client?.name ?? 'Sem cliente')}
          {task.category ? ` · ${task.category}` : ''}
          {task.due_date ? ` · Prazo: ${formatDate(task.due_date)}` : ''}
        </p>
      </div>

      <Badge className="border-[#1A2540] bg-secondary/50 text-muted-foreground">
        {taskPriorityLabels[task.priority] ?? task.priority}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={updateStatus.isPending}>
          <Badge className={`cursor-pointer ${taskStatusStyles[task.status]}`}>
            {taskStatusLabels[task.status] ?? task.status}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {CHANGEABLE_STATUSES.map((status) => (
            <DropdownMenuItem key={status} onSelect={() => updateStatus.mutate({ taskId: task.id, status })}>
              {taskStatusLabels[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <KanbanTaskFormDialog
        task={task}
        trigger={
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Pencil className="h-4 w-4" />
          </Button>
        }
      />

      {deleteMode && (
        <DeleteItemButton label={`a tarefa "${task.title}"`} onDelete={() => deleteTask.mutateAsync(task.id)} />
      )}
    </div>
  )
}
