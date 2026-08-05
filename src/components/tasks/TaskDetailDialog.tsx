import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { TaskRecord } from '@/hooks/useClientPortalData'
import { formatDate } from '@/lib/format'
import { taskPriorityLabels, taskStatusLabels, taskStatusStyles } from '@/lib/status-styles'

interface TaskDetailDialogProps {
  task: TaskRecord | null
  onOpenChange: (open: boolean) => void
}

export function TaskDetailDialog({ task, onOpenChange }: TaskDetailDialogProps) {
  return (
    <Dialog open={!!task} onOpenChange={onOpenChange}>
      <DialogContent>
        {task && (
          <>
            <DialogHeader>
              <DialogTitle>{task.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={taskStatusStyles[task.status]}>{taskStatusLabels[task.status] ?? task.status}</Badge>
                <Badge className="border-[#1A2540] bg-secondary/50 text-muted-foreground">
                  Prioridade: {taskPriorityLabels[task.priority] ?? task.priority}
                </Badge>
                {task.category && (
                  <Badge className="border-[#1A2540] bg-secondary/50 text-muted-foreground">{task.category}</Badge>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Prazo</p>
                <p className="text-sm text-foreground">{formatDate(task.due_date)}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Descrição</p>
                <p className="text-sm text-foreground">{task.description ?? 'Sem descrição.'}</p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
