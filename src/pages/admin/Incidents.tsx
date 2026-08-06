import { IncidentList } from '@/components/incidents/IncidentList'
import { NewIncidentDialog } from '@/components/incidents/NewIncidentDialog'
import { SeverityCounts } from '@/components/incidents/SeverityCounts'
import { useAllIncidents } from '@/hooks/useManagerPortalData'

export default function Incidents() {
  const { data: incidents, isLoading } = useAllIncidents()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Incidentes</h1>
        </div>
        <NewIncidentDialog />
      </div>

      <SeverityCounts incidents={incidents ?? []} />
      <IncidentList incidents={incidents ?? []} />
    </div>
  )
}
