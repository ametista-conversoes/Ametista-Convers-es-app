import { useState } from 'react'
import { AssetCard } from '@/components/assets/AssetCard'
import { NewAssetDialog } from '@/components/assets/NewAssetDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllClients, useAllDigitalAssets } from '@/hooks/useManagerPortalData'

const ALL_CLIENTS = 'all'

export default function Assets() {
  const { data: clients } = useAllClients()
  const { data: assets, isLoading } = useAllDigitalAssets()
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const filteredAssets = (assets ?? []).filter(
    (asset) => clientFilter === ALL_CLIENTS || asset.client_id === clientFilter,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Ativos Digitais</h1>
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
          <NewAssetDialog />
        </div>
      </div>

      {filteredAssets.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum ativo digital cadastrado ainda.</p>
      )}

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      </div>
    </div>
  )
}
