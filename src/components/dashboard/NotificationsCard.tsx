import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AlertRecord } from '@/hooks/useClientPortalData'
import { formatDateTime } from '@/lib/format'
import { severityLabels, severityStyles } from '@/lib/status-styles'

interface NotificationsCardProps {
  alerts: AlertRecord[]
}

export function NotificationsCard({ alerts }: NotificationsCardProps) {
  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-purple-400" />
          Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {alerts.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma notificação no momento.</p>}
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-lg bg-secondary/50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{alert.title}</p>
              <Badge className={severityStyles[alert.severity]}>{severityLabels[alert.severity] ?? alert.severity}</Badge>
            </div>
            {alert.message && <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>}
            <p className="mt-1 text-xs text-muted-foreground/70">{formatDateTime(alert.created_at)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
