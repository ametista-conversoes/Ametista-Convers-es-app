import { useState } from 'react'
import { Siren } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ManagerIncidentRecord } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'
import { incidentStatusLabels, incidentStatusStyles, severityLabels, severityStyles } from '@/lib/status-styles'
import { ResolveIncidentDialog } from './ResolveIncidentDialog'

interface IncidentListProps {
  incidents: ManagerIncidentRecord[]
}

export function IncidentList({ incidents }: IncidentListProps) {
  const [resolvingIncident, setResolvingIncident] = useState<ManagerIncidentRecord | null>(null)

  return (
    <>
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Siren className="h-4 w-4 text-purple-400" />
            Incidentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0 pt-4">
          {incidents.length === 0 && <p className="text-sm text-muted-foreground">Nenhum incidente registrado.</p>}
          {incidents.map((incident) => {
            const isOpen = incident.status !== 'resolved' && incident.status !== 'closed'
            return (
              <div key={incident.id} className="rounded-lg bg-secondary/50 px-3 py-3">
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
                <p className="mt-1 text-xs text-muted-foreground">
                  {incident.client?.name ?? 'Cliente'}
                  {incident.category ? ` · ${incident.category}` : ''} · {formatDateTime(incident.created_at)}
                </p>
                {incident.resolution && (
                  <p className="mt-2 text-xs text-muted-foreground">Resolução: {incident.resolution}</p>
                )}
                {isOpen && (
                  <div className="mt-3">
                    <Button size="sm" variant="secondary" onClick={() => setResolvingIncident(incident)}>
                      Resolver
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <ResolveIncidentDialog incident={resolvingIncident} onOpenChange={(open) => !open && setResolvingIncident(null)} />
    </>
  )
}
