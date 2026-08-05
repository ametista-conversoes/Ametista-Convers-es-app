import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ManagerClientRecord } from '@/hooks/useManagerPortalData'
import { formatCurrency } from '@/lib/format'
import { clientStatusLabels, clientStatusStyles } from '@/lib/status-styles'
import { cn } from '@/lib/utils'

interface ClientCardProps {
  client: ManagerClientRecord
}

// Cor da borda lateral acompanha o status (mesma paleta semântica já usada
// nos badges de clientStatusStyles em src/lib/status-styles.ts).
const statusBorderColor: Record<string, string> = {
  active: 'border-l-emerald-500',
  onboarding: 'border-l-sky-500',
  paused: 'border-l-amber-500',
  churned: 'border-l-destructive',
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Card
      className={cn(
        'rounded-xl border border-l-4 border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6',
        statusBorderColor[client.status] ?? 'border-l-slate-500',
      )}
    >
      <CardHeader className="p-0">
        <CardTitle className="flex items-start justify-between gap-2 text-base">
          <span className="truncate">{client.name}</span>
          <Badge className={clientStatusStyles[client.status]}>
            {clientStatusLabels[client.status] ?? client.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-0 pt-4 text-sm">
        <p className="truncate text-muted-foreground">{client.company ?? 'Sem empresa'}</p>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Plano</span>
          <span className="font-medium text-foreground">{client.plan ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Mensalidade</span>
          <span className="font-medium text-foreground">{formatCurrency(client.monthly_fee)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Health Score</span>
          <span className="font-medium text-foreground">{client.health_score ?? '—'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
