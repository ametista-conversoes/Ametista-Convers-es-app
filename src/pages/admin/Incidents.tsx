import { useState } from 'react'
import { IncidentList } from '@/components/incidents/IncidentList'
import { NewIncidentDialog } from '@/components/incidents/NewIncidentDialog'
import { SeverityCounts } from '@/components/incidents/SeverityCounts'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { useAllIncidents } from '@/hooks/useManagerPortalData'

export default function Incidents() {
  const { data: incidents, isLoading } = useAllIncidents()
  const [deleteMode, setDeleteMode] = useState(false)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Portal Gestor</p>
            <h1 className="text-2xl font-semibold text-foreground">Incidentes</h1>
          </div>
          <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />
        </div>
        <NewIncidentDialog />
      </div>

      <SeverityCounts incidents={incidents ?? []} />
      <IncidentList incidents={incidents ?? []} deleteMode={deleteMode} />
    </div>
  )
}
