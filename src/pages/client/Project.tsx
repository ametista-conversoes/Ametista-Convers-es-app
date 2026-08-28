import { useState } from 'react'
import { FolderKanban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoalsProgressCard } from '@/components/dashboard/GoalsProgressCard'
import { ProjectInfoCards } from '@/components/project/ProjectInfoCards'
import { UnlinkedClientNotice } from '@/components/shared/UnlinkedClientNotice'
import { TaskList } from '@/components/tasks/TaskList'
import { useAuth } from '@/contexts/AuthContext'
import { useClient, useProjects, useSmartGoals, useTasks } from '@/hooks/useClientPortalData'
import { cn } from '@/lib/utils'
import { projectStatusLabels, projectStatusStyles } from '@/lib/status-styles'

export default function Project() {
  const { clientId } = useAuth()
  const { data: client, isLoading: loadingClient, isError: clientIsError } = useClient()
  const { data: projects, isLoading: loadingProjects, isError: projectsIsError } = useProjects()
  const { data: tasks } = useTasks()
  const { data: goals } = useSmartGoals()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  if (!clientId) {
    return <UnlinkedClientNotice page="um Projeto" />
  }

  if (loadingClient || loadingProjects) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (clientIsError || projectsIsError) {
    return <p className="text-sm text-destructive">Erro ao carregar os dados. Tente novamente.</p>
  }

  const projectList = projects ?? []
  const mostRecentProject = [...projectList].sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))[0]
  const project = projectList.find((p) => p.id === selectedProjectId) ?? mostRecentProject

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
        <h1 className="text-2xl font-semibold text-foreground">Projetos</h1>
      </div>

      {projectList.length > 1 && (
        <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4 text-purple-400" />
              Todos os Projetos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-0 pt-4">
            {projectList.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={cn(
                  'cursor-pointer rounded-lg bg-secondary/50 px-3 py-2 hover:bg-secondary',
                  p.id === project.id && 'border border-purple-600/20 bg-purple-600/15',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <Badge className={projectStatusStyles[p.status]}>{projectStatusLabels[p.status] ?? p.status}</Badge>
                </div>
                {p.objective && <p className="mt-1 text-xs text-muted-foreground">{p.objective}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">{project.title}</h2>
        <div className="space-y-6">
          <ProjectInfoCards client={client} project={project} />

          <div className="content-grid-container">
            <div className="content-grid gap-4">
              <GoalsProgressCard goals={goals ?? []} />
              <TaskList tasks={projectTasks} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
