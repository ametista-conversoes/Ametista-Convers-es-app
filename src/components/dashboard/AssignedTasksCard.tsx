import { CheckSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TaskRecord } from '@/hooks/useClientPortalData'
import { formatDate } from '@/lib/format'
import { taskStatusLabels, taskStatusStyles } from '@/lib/status-styles'

interface AssignedTasksCardProps {
  tasks: TaskRecord[]
}

export function AssignedTasksCard({ tasks }: AssignedTasksCardProps) {
  const pending = tasks.filter((t) => t.status !== 'done').slice(0, 5)

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckSquare className="h-4 w-4 text-purple-400" />
          Tarefas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {pending.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente.</p>}
        {pending.map((task) => (
          <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
              <p className="text-xs text-muted-foreground">Prazo: {formatDate(task.due_date)}</p>
            </div>
            <Badge className={taskStatusStyles[task.status]}>{taskStatusLabels[task.status] ?? task.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
