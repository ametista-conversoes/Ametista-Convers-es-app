import { useState } from 'react'
import { Plug, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllClients, useAllDigitalAssets, useDigitalAssetConnections } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'
import { syncIntegration } from '@/lib/integrations'
import { connectionProviderLabels, connectionStatusLabels, connectionStatusStyles } from '@/lib/status-styles'

const ALL_CLIENTS = 'all'
const SYNCABLE_PROVIDERS = ['google_ads', 'meta_ads']

export default function Integrations() {
  const { data: clients } = useAllClients()
  const { data: assets, isLoading } = useAllDigitalAssets()
  const { data: connections } = useDigitalAssetConnections()
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)
  const [search, setSearch] = useState('')
  const [syncingId, setSyncingId] = useState<string | null>(null)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const assetsById = new Map((assets ?? []).map((asset) => [asset.id, asset]))

  const term = search.trim().toLowerCase()
  const rows = (connections ?? [])
    .map((connection) => ({ connection, asset: assetsById.get(connection.digital_asset_id) }))
    .filter((row) => !!row.asset)
    .filter((row) => clientFilter === ALL_CLIENTS || row.asset!.client_id === clientFilter)
    .filter((row) => !term || row.asset!.name.toLowerCase().includes(term))

  async function handleSync(connectionId: string) {
    setSyncingId(connectionId)
    try {
      const result = await syncIntegration(connectionId)
      toast.success(`Sincronizado — ${result.syncedDays} dia(s) de métricas atualizados.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível sincronizar.')
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Integrações</h1>
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
        </div>
      </div>

      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4 text-purple-400" />
            Conexões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-0 pt-4">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma integração conectada ainda. Vá em "Ativos Digitais" pra conectar a primeira.
            </p>
          )}
          {rows.map(({ connection, asset }) => {
            return (
              <div
                key={connection.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {connectionProviderLabels[connection.provider] ?? connection.provider}
                    </p>
                    <Badge className={connectionStatusStyles[connection.status]}>
                      {connectionStatusLabels[connection.status] ?? connection.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {asset!.name} · {asset!.client?.name ?? 'Cliente'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Última sincronização: {formatDateTime(connection.last_synced_at)}
                  </p>
                </div>
                {connection.status === 'connected' && SYNCABLE_PROVIDERS.includes(connection.provider) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={syncingId === connection.id}
                    onClick={() => handleSync(connection.id)}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${syncingId === connection.id ? 'animate-spin' : ''}`} />
                    Sincronizar agora
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
