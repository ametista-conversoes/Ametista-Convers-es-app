import { CheckSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { TaskRecord } from '@/hooks/useClientPortalData'
import { formatDate } from '@/lib/format'
import { taskPriorityLabels, taskStatusLabels, taskStatusStyles } from '@/lib/status-styles'

interface TaskListProps {
  tasks: TaskRecord[]
  title?: string
  /** Quando true, mostra um checkbox para marcar/desmarcar a tarefa como concluída. */
  interactive?: boolean
  onToggleDone?: (taskId: string, done: boolean) => void
  togglingTaskId?: string | null
}

export function TaskList({
  tasks,
  title = 'Tarefas do projeto',
  interactive = false,
  onToggleDone,
  togglingTaskId = null,
}: TaskListProps) {
  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckSquare className="h-4 w-4 text-purple-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {tasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa cadastrada.</p>}
        {tasks.map((task) => {
          const isDone = task.status === 'done'
          return (
            <div key={task.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2">
              {interactive && (
                <Checkbox
                  checked={isDone}
                  disabled={togglingTaskId === task.id}
                  onCheckedChange={(checked) => onToggleDone?.(task.id, checked === true)}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {taskPriorityLabels[task.priority] ?? task.priority} · Prazo: {formatDate(task.due_date)}
                  {task.category ? ` · ${task.category}` : ''}
                </p>
              </div>
              <Badge className={taskStatusStyles[task.status]}>{taskStatusLabels[task.status] ?? task.status}</Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
