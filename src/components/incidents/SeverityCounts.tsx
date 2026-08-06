import { Card } from '@/components/ui/card'
import type { ManagerIncidentRecord } from '@/hooks/useManagerPortalData'
import { severityLabels } from '@/lib/status-styles'

interface SeverityCountsProps {
  incidents: ManagerIncidentRecord[]
}

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const

const DOT_COLOR: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-400',
  critical: 'bg-destructive',
}

export function SeverityCounts({ incidents }: SeverityCountsProps) {
  const open = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed')

  return (
    <div className="content-grid-container">
      <div className="content-grid gap-4">
        {SEVERITIES.map((severity) => {
          const count = open.filter((i) => i.severity === severity).length
          return (
            <Card
              key={severity}
              className="flex items-center gap-3 rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_COLOR[severity]}`} />
              <div>
                <p className="text-sm text-muted-foreground">{severityLabels[severity]}</p>
                <p className="text-xl font-semibold text-foreground">{count}</p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
