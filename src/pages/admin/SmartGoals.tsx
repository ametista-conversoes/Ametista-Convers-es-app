import { useState } from 'react'
import { NewSmartGoalDialog } from '@/components/smart-goals/NewSmartGoalDialog'
import { SmartGoalCard } from '@/components/smart-goals/SmartGoalCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllClients, useAllSmartGoals } from '@/hooks/useManagerPortalData'

const ALL_CLIENTS = 'all'

export default function SmartGoals() {
  const { data: clients } = useAllClients()
  const { data: goals, isLoading } = useAllSmartGoals()
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const filteredGoals = (goals ?? []).filter(
    (goal) => clientFilter === ALL_CLIENTS || goal.client_id === clientFilter,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Metas SMART</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLIENTS}>Todos os clientes</SelectItem>
              {(clients ?? []).map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NewSmartGoalDialog />
        </div>
      </div>

      {filteredGoals.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada ainda.</p>}

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {filteredGoals.map((goal) => (
            <SmartGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>
    </div>
  )
}
