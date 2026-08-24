import { GoalsProgressCard } from '@/components/dashboard/GoalsProgressCard'
import { ProjectInfoCards } from '@/components/project/ProjectInfoCards'
import { UnlinkedClientNotice } from '@/components/shared/UnlinkedClientNotice'
import { TaskList } from '@/components/tasks/TaskList'
import { useAuth } from '@/contexts/AuthContext'
import { useClient, useProjects, useSmartGoals, useTasks } from '@/hooks/useClientPortalData'

export default function Project() {
  const { clientId } = useAuth()
  const { data: client, isLoading: loadingClient } = useClient()
  const { data: projects, isLoading: loadingProjects } = useProjects()
  const { data: tasks } = useTasks()
  const { data: goals } = useSmartGoals()

  if (!clientId) {
    return <UnlinkedClientNotice page="um Projeto" />
  }

  if (loadingClient || loadingProjects) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const projectList = projects ?? []
  const project = [...projectList].sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))[0]

  if (!client || !project) {
    return (
      <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6 text-sm text-muted-foreground">
        Ainda não há nenhum projeto cadastrado para esta conta.
      </div>
    )
  }

  const projectTasks = (tasks ?? []).filter((task) => task.project_id === project.id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Portal Cliente</p>
        <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
      </div>

      <ProjectInfoCards client={client} project={project} />

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          <GoalsProgressCard goals={goals ?? []} />
          <TaskList tasks={projectTasks} />
        </div>
      </div>
    </div>
  )
}
