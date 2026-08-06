import { Bell, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ManagerAlertRecord } from '@/hooks/useManagerPortalData'
import { useResolveAlert } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'
import { severityLabels, severityStyles } from '@/lib/status-styles'

interface AlertListProps {
  alerts: ManagerAlertRecord[]
}

export function AlertList({ alerts }: AlertListProps) {
  const resolveAlert = useResolveAlert()
  const active = alerts.filter((a) => !a.resolved)
  const resolved = alerts.filter((a) => a.resolved)

  async function handleResolve(alertId: string) {
    try {
      await resolveAlert.mutateAsync(alertId)
    } catch {
      toast.error('Não foi possível resolver o alerta.')
    }
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-purple-400" />
            Alertas ativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0 pt-4">
          {active.length === 0 && <p className="text-sm text-muted-foreground">Nenhum alerta ativo.</p>}
          {active.map((alert) => (
            <div key={alert.id} className="rounded-lg bg-secondary/50 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <Badge className={severityStyles[alert.severity]}>
                  {severityLabels[alert.severity] ?? alert.severity}
                </Badge>
              </div>
              {alert.message && <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>}
              <p className="mt-1 text-xs text-muted-foreground/70">
                {alert.client?.name ?? 'Cliente'} · {formatDateTime(alert.created_at)}
              </p>
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={() => handleResolve(alert.id)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Marcar como resolvido
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="text-base">Resolvidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0 pt-4">
          {resolved.length === 0 && <p className="text-sm text-muted-foreground">Nenhum alerta resolvido ainda.</p>}
          {resolved.map((alert) => (
            <div key={alert.id} className="rounded-lg bg-secondary/30 px-3 py-2 opacity-70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-foreground">{alert.title}</p>
                <Badge className={severityStyles[alert.severity]}>
                  {severityLabels[alert.severity] ?? alert.severity}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {alert.client?.name ?? 'Cliente'} · {formatDateTime(alert.created_at)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
