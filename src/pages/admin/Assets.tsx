import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { AssetCard } from '@/components/assets/AssetCard'
import { AssetFormDialog } from '@/components/assets/AssetFormDialog'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllClients, useAllDigitalAssets } from '@/hooks/useManagerPortalData'

const ALL_CLIENTS = 'all'

export default function Assets() {
  const { data: clients } = useAllClients()
  const { data: assets, isLoading } = useAllDigitalAssets()
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)
  const [deleteMode, setDeleteMode] = useState(false)
  const [search, setSearch] = useState('')

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const term = search.trim().toLowerCase()
  const filteredAssets = (assets ?? [])
    .filter((asset) => clientFilter === ALL_CLIENTS || asset.client_id === clientFilter)
    .filter(
      (asset) => !term || asset.name.toLowerCase().includes(term) || (asset.platform ?? '').toLowerCase().includes(term),
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Portal Gestor</p>
            <h1 className="text-2xl font-semibold text-foreground">Ativos Digitais</h1>
          </div>
          <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar ativo..."
              className="w-48 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
          <AssetFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Novo ativo
              </Button>
            }
          />
        </div>
      </div>

      {filteredAssets.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum ativo digital encontrado.</p>
      )}

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} deleteMode={deleteMode} />
          ))}
        </div>
      </div>
    </div>
  )
}
