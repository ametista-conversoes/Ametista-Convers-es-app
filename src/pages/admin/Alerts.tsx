import { useState } from 'react'
import { AlertList } from '@/components/alerts/AlertList'
import { NewAlertDialog } from '@/components/alerts/NewAlertDialog'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { useAllAlerts } from '@/hooks/useManagerPortalData'

export default function Alerts() {
  const { data: alerts, isLoading } = useAllAlerts()
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
            <h1 className="text-2xl font-semibold text-foreground">Alertas</h1>
          </div>
          <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />
        </div>
        <NewAlertDialog />
      </div>

      <AlertList alerts={alerts ?? []} deleteMode={deleteMode} />
    </div>
  )
}
