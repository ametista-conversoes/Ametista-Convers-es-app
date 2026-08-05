import { useState } from 'react'
import { Search } from 'lucide-react'
import { ClientCard } from '@/components/admin/ClientCard'
import { NewClientDialog } from '@/components/admin/NewClientDialog'
import { Input } from '@/components/ui/input'
import { useAllClients } from '@/hooks/useManagerPortalData'

export default function Clients() {
  const { data: clients, isLoading } = useAllClients()
  const [search, setSearch] = useState('')

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const term = search.trim().toLowerCase()
  const filteredClients = (clients ?? []).filter((client) => {
    if (!term) return true
    return client.name.toLowerCase().includes(term) || (client.company ?? '').toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
        </div>
        <NewClientDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou empresa..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {filteredClients.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
          )}
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      </div>
    </div>
  )
}
