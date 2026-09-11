import { useState } from 'react'
import { NewTaskDialog } from '@/components/tasks/NewTaskDialog'
import { TaskList } from '@/components/tasks/TaskList'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { UnlinkedClientNotice } from '@/components/shared/UnlinkedClientNotice'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useClient, useDeleteTask, useSetTaskStatus, useTasks } from '@/hooks/useClientPortalData'
import { useMarkNavSeen } from '@/hooks/useNavSeen'
import { effectiveTaskStatus } from '@/lib/recurrence'
import { taskStatusLabels } from '@/lib/status-styles'

const FILTERS = ['todos', 'backlog', 'todo', 'in_progress', 'review', 'done'] as const
type Filter = (typeof FILTERS)[number]

export default function Tasks() {
  useMarkNavSeen('/tasks')
  const { clientId } = useAuth()
  const { data: client } = useClient()
  const { data: tasks, isLoading } = useTasks()
  const setTaskStatus = useSetTaskStatus()
  const deleteTask = useDeleteTask()
  const [filter, setFilter] = useState<Filter>('todos')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState(false)

  if (!clientId) {
    return <UnlinkedClientNotice page="Tarefas" />
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  // Fase 35 — uma tarefa recorrente marcada "done" volta a aparecer como
  // "todo" sozinha depois que o intervalo dela vence (ver recurrence.ts);
  // é um status derivado só pra exibição, o banco continua com "done"
  // até a pessoa marcar de novo (o que só atualiza o carimbo de tempo).
  const allTasks = (tasks ?? []).map((task) => ({
    ...task,
    status: effectiveTaskStatus(task.status, task.recurrence_interval, task.completed_at, client?.plan ?? null),
  }))
  const filteredTasks = filter === 'todos' ? allTasks : allTasks.filter((task) => task.status === filter)

  async function handleChangeStatus(taskId: string, status: string) {
    setUpdatingTaskId(taskId)
    try {
      await setTaskStatus.mutateAsync({ taskId, status })
    } catch {
      // erro já avisado pelo onError do hook
    } finally {
      setUpdatingTaskId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Portal Cliente</p>
            <h1 className="text-2xl font-semibold text-foreground">Tarefas</h1>
          </div>
          <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />
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
        onToggleDone={(taskId, done) => handleChangeStatus(taskId, done ? 'done' : 'todo')}
        onChangeStatus={handleChangeStatus}
        updatingTaskId={updatingTaskId}
        deleteMode={deleteMode}
        onDelete={(taskId) => deleteTask.mutateAsync(taskId)}
      />
    </div>
  )
}
