import { useState } from 'react'
import { Siren } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import type { ManagerAlertRecord, ManagerIncidentRecord } from '@/hooks/useManagerPortalData'
import { useDeleteAlert, useDeleteIncident, useResolveAlert } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'
import { incidentStatusLabels, incidentStatusStyles, severityLabels, severityStyles } from '@/lib/status-styles'
import { ResolveIncidentDialog } from './ResolveIncidentDialog'

interface IncidentAlertListProps {
  incidents: ManagerIncidentRecord[]
  alerts: ManagerAlertRecord[]
  deleteMode?: boolean
}

/** Lista unificada de Incidentes e Alertas (Fase 6.5.6) — os dois
 * bancos continuam separados (`incidents`/`alerts`), essa lista só
 * junta e mostra os dois juntos, resolvendo cada um pelo fluxo que já
 * existia (`ResolveIncidentDialog` pede um texto; alerta só marca
 * resolvido direto, como já era em `AlertList.tsx`). */
export function IncidentAlertList({ incidents, alerts, deleteMode }: IncidentAlertListProps) {
  const [resolvingIncident, setResolvingIncident] = useState<ManagerIncidentRecord | null>(null)
  const deleteIncident = useDeleteIncident()
  const deleteAlert = useDeleteAlert()
  const resolveAlert = useResolveAlert()

  async function handleResolveAlert(alertId: string) {
    try {
      await resolveAlert.mutateAsync(alertId)
    } catch {
      toast.error('Não foi possível resolver o alerta.')
    }
  }

  const items = [
    ...incidents.map((incident) => ({ source: 'incident' as const, incident })),
    ...alerts.map((alert) => ({ source: 'alert' as const, alert })),
  ]

  return (
    <>
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Siren className="h-4 w-4 text-purple-400" />
            Incidentes e Alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0 pt-4">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Nada registrado ainda.</p>}

          {items.map((item) => {
            if (item.source === 'incident') {
              const incident = item.incident
              const isOpen = incident.status !== 'resolved' && incident.status !== 'closed'
              return (
                <div key={`incident-${incident.id}`} className="rounded-lg bg-secondary/50 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{incident.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={severityStyles[incident.severity]}>
                        {severityLabels[incident.severity] ?? incident.severity}
                      </Badge>
                      <Badge className={incidentStatusStyles[incident.status]}>
                        {incidentStatusLabels[incident.status] ?? incident.status}
                      </Badge>
                      {deleteMode && (
                        <DeleteItemButton
                          label={`o item "${incident.title}"`}
                          onDelete={() => deleteIncident.mutateAsync(incident.id)}
                        />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {incident.client?.name ?? 'Cliente'}
                    {incident.category ? ` · ${incident.category}` : ''} · {formatDateTime(incident.created_at)}
                  </p>
                  {incident.description && <p className="mt-2 text-xs text-muted-foreground">{incident.description}</p>}
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
            }

            const alert = item.alert
            return (
              <div key={`alert-${alert.id}`} className={`rounded-lg bg-secondary/50 px-3 py-3 ${alert.resolved ? 'opacity-70' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={severityStyles[alert.severity]}>
                      {severityLabels[alert.severity] ?? alert.severity}
                    </Badge>
                    <Badge className={alert.resolved ? incidentStatusStyles.resolved : incidentStatusStyles.open}>
                      {alert.resolved ? 'Resolvido' : 'Aberto'}
                    </Badge>
                    {deleteMode && (
                      <DeleteItemButton
                        label={`o item "${alert.title}"`}
                        onDelete={() => deleteAlert.mutateAsync(alert.id)}
                      />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {alert.client?.name ?? 'Cliente'}
                  {alert.category ? ` · ${alert.category}` : ''} · {formatDateTime(alert.created_at)}
                </p>
                {alert.message && <p className="mt-2 text-xs text-muted-foreground">{alert.message}</p>}
                {!alert.resolved && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={resolveAlert.isPending}
                      onClick={() => handleResolveAlert(alert.id)}
                    >
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
