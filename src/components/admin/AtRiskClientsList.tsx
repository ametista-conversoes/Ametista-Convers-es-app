import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ManagerClientRecord } from '@/hooks/useManagerPortalData'

interface AtRiskClientsListProps {
  clients: ManagerClientRecord[]
}

export function AtRiskClientsList({ clients }: AtRiskClientsListProps) {
  const atRisk = clients
    .filter((c) => (c.health_score ?? 100) < 50)
    .sort((a, b) => (a.health_score ?? 0) - (b.health_score ?? 0))

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Clientes em risco
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {atRisk.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cliente em risco no momento.</p>}
        {atRisk.map((client) => (
          <div key={client.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{client.name}</p>
              <p className="text-xs text-muted-foreground">{client.company ?? 'Sem empresa'}</p>
            </div>
            <Badge className="border-destructive/20 bg-destructive/10 text-destructive">
              Health Score: {client.health_score}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
