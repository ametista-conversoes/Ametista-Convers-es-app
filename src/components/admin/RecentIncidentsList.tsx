import { Siren } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ManagerIncidentRecord } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'
import { incidentStatusLabels, incidentStatusStyles, severityLabels, severityStyles } from '@/lib/status-styles'

interface RecentIncidentsListProps {
  incidents: ManagerIncidentRecord[]
}

export function RecentIncidentsList({ incidents }: RecentIncidentsListProps) {
  const open = incidents
    .filter((i) => i.status === 'open' || i.status === 'in_progress')
    .slice(0, 6)

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Siren className="h-4 w-4 text-purple-400" />
          Incidentes abertos recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {open.length === 0 && <p className="text-sm text-muted-foreground">Nenhum incidente aberto no momento.</p>}
        {open.map((incident) => (
          <div key={incident.id} className="rounded-lg bg-secondary/50 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{incident.title}</p>
              <div className="flex items-center gap-2">
                <Badge className={severityStyles[incident.severity]}>
                  {severityLabels[incident.severity] ?? incident.severity}
                </Badge>
                <Badge className={incidentStatusStyles[incident.status]}>
                  {incidentStatusLabels[incident.status] ?? incident.status}
                </Badge>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground/70">{formatDateTime(incident.created_at)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
