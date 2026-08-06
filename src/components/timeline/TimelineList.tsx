import { Bell, History, Siren, Workflow as WorkflowIcon, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TimelineEventRecord } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'
import { severityLabels, severityStyles } from '@/lib/status-styles'

interface TimelineListProps {
  events: TimelineEventRecord[]
}

const ENTITY_ICONS: Record<string, LucideIcon> = {
  incident: Siren,
  alert: Bell,
  project: WorkflowIcon,
}

export function TimelineList({ events }: TimelineListProps) {
  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-purple-400" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {events.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>}
        {events.map((event) => {
          const Icon = ENTITY_ICONS[event.entity_type ?? ''] ?? History
          return (
            <div key={event.id} className="flex items-start gap-3 rounded-lg bg-secondary/50 px-3 py-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600/15 text-purple-400">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{event.action}</p>
                  <Badge className={severityStyles[event.severity]}>
                    {severityLabels[event.severity] ?? event.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {event.client?.name ?? 'Agência'} · {formatDateTime(event.created_at)}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
