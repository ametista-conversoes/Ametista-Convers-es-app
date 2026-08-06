import { useState } from 'react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { NewKanbanTaskDialog } from '@/components/kanban/NewKanbanTaskDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllClients, useAllTasks } from '@/hooks/useManagerPortalData'

const ALL_CLIENTS = 'all'

export default function Kanban() {
  const { data: clients } = useAllClients()
  const { data: tasks, isLoading } = useAllTasks()
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const filteredTasks = (tasks ?? []).filter((task) => clientFilter === ALL_CLIENTS || task.client_id === clientFilter)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Kanban</h1>
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
          <NewKanbanTaskDialog />
        </div>
      </div>

      <KanbanBoard tasks={filteredTasks} />
    </div>
  )
}
