import { useState } from 'react'
import { IncidentAlertList } from '@/components/incidents/IncidentAlertList'
import { NewIncidentDialog } from '@/components/incidents/NewIncidentDialog'
import { SeverityCounts } from '@/components/incidents/SeverityCounts'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { useAllAlerts, useAllIncidents } from '@/hooks/useManagerPortalData'
import { useMarkNavSeen } from '@/hooks/useNavSeen'

export default function Incidents() {
  useMarkNavSeen('/incidents')
  const { data: incidents, isLoading: isLoadingIncidents } = useAllIncidents()
  const { data: alerts, isLoading: isLoadingAlerts } = useAllAlerts()
  const [deleteMode, setDeleteMode] = useState(false)

  if (isLoadingIncidents || isLoadingAlerts) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Portal Gestor</p>
            <h1 className="text-2xl font-semibold text-foreground">Incidentes e Alertas</h1>
          </div>
          <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />
        </div>
        <NewIncidentDialog />
      </div>

      <SeverityCounts incidents={incidents ?? []} alerts={alerts ?? []} />
      <IncidentAlertList incidents={incidents ?? []} alerts={alerts ?? []} deleteMode={deleteMode} />
    </div>
  )
}
