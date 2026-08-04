import { Building2, Calendar, Crosshair, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ClientRecord, ProjectRecord } from '@/hooks/useClientPortalData'
import { formatDate } from '@/lib/format'
import { projectStatusLabels, projectStatusStyles } from '@/lib/status-styles'

interface ProjectInfoCardsProps {
  client: ClientRecord
  project: ProjectRecord
}

export function ProjectInfoCards({ client, project }: ProjectInfoCardsProps) {
  return (
    <div className="content-grid-container">
      <div className="content-grid gap-4">
        <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-purple-400" />
              Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4 text-sm text-foreground">
            <p>{client.company ?? client.name}</p>
            {project.segment && <p className="mt-1 text-xs text-muted-foreground">{project.segment}</p>}
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-purple-400" />
              Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4 text-sm text-foreground">
            {project.objective ?? <span className="text-muted-foreground">Ainda não definido.</span>}
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crosshair className="h-4 w-4 text-purple-400" />
              Público-alvo (ICP)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4 text-sm text-foreground">
            {project.icp ?? <span className="text-muted-foreground">Ainda não definido.</span>}
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-purple-400" />
              Cronograma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-0 pt-4 text-sm">
            <Badge className={projectStatusStyles[project.status]}>
              {projectStatusLabels[project.status] ?? project.status}
            </Badge>
            <p className="text-muted-foreground">
              {formatDate(project.start_date)} — {project.end_date ? formatDate(project.end_date) : 'sem data final'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
