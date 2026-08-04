import { useState } from 'react'
import { toast } from 'sonner'
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog'
import { TaskList } from '@/components/tasks/TaskList'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useSetTaskDone, useTasks } from '@/hooks/useClientPortalData'
import { taskStatusLabels } from '@/lib/status-styles'

const FILTERS = ['todos', 'backlog', 'todo', 'in_progress', 'review', 'done'] as const
type Filter = (typeof FILTERS)[number]

export default function Tasks() {
  const { clientId } = useAuth()
  const { data: tasks, isLoading } = useTasks()
  const setTaskDone = useSetTaskDone()
  const [filter, setFilter] = useState<Filter>('todos')
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)

  if (!clientId) {
    return (
      <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6 text-sm text-muted-foreground">
        Esta conta não está vinculada a nenhum cliente, então não há Tarefas para mostrar.
      </div>
    )
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const allTasks = tasks ?? []
  const filteredTasks = filter === 'todos' ? allTasks : allTasks.filter((task) => task.status === filter)

  async function handleToggleDone(taskId: string, done: boolean) {
    setTogglingTaskId(taskId)
    try {
      await setTaskDone.mutateAsync({ taskId, done })
    } catch {
      toast.error('Não foi possível atualizar a tarefa.')
    } finally {
      setTogglingTaskId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Cliente</p>
          <h1 className="text-2xl font-semibold text-foreground">Tarefas</h1>
        </div>
        <NewTaskDialog />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilter('todos')}>
          <Badge
            className={
              filter === 'todos'
                ? 'border-purple-600/20 bg-purple-600/15 text-purple-400'
                : 'border-[#1A2540] bg-secondary/50 text-muted-foreground'
            }
          >
            Todas
          </Badge>
        </button>
        {FILTERS.filter((f) => f !== 'todos').map((status) => (
          <button key={status} type="button" onClick={() => setFilter(status)}>
            <Badge
              className={
                filter === status
                  ? 'border-purple-600/20 bg-purple-600/15 text-purple-400'
                  : 'border-[#1A2540] bg-secondary/50 text-muted-foreground'
              }
            >
              {taskStatusLabels[status]}
            </Badge>
          </button>
        ))}
      </div>

      <TaskList
        tasks={filteredTasks}
        title="Todas as tarefas"
        interactive
        onToggleDone={handleToggleDone}
        togglingTaskId={togglingTaskId}
      />
    </div>
  )
}
