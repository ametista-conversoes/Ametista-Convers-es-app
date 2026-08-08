import { useState } from 'react'
import { Search } from 'lucide-react'
import { ClientCard } from '@/components/admin/ClientCard'
import { NewClientDialog } from '@/components/admin/NewClientDialog'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import {
  useAllAlerts,
  useAllClients,
  useAllIncidents,
  useAllSmartGoals,
  useAllTasks,
  useDeleteClient,
} from '@/hooks/useManagerPortalData'
import { computeClientHasProblems } from '@/lib/client-risk'

export default function Clients() {
  const { role } = useAuth()
  const { data: clients, isLoading } = useAllClients()
  const { data: incidents } = useAllIncidents()
  const { data: alerts } = useAllAlerts()
  const { data: tasks } = useAllTasks()
  const { data: goals } = useAllSmartGoals()
  const deleteClient = useDeleteClient()
  const [search, setSearch] = useState('')
  const [deleteMode, setDeleteMode] = useState(false)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const term = search.trim().toLowerCase()
  const filteredClients = (clients ?? []).filter((client) => {
    if (!term) return true
    return client.name.toLowerCase().includes(term) || (client.company ?? '').toLowerCase().includes(term)
  })

  const riskInputs = { incidents: incidents ?? [], alerts: alerts ?? [], tasks: tasks ?? [], goals: goals ?? [] }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Portal Gestor</p>
            <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
          </div>
          {role === 'admin' && <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou empresa..."
              className="w-64 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <NewClientDialog />
        </div>
      </div>

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {filteredClients.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          )}
          {filteredClients.map((client) => (
            <div key={client.id} className="relative">
              <ClientCard client={client} hasProblems={computeClientHasProblems(client.id, riskInputs)} />
              {deleteMode && role === 'admin' && (
                <DeleteItemButton
                  label={`o cliente "${client.name}"`}
                  onDelete={() => deleteClient.mutateAsync(client.id)}
                  className="absolute left-2 top-2 bg-[#131C31]"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
