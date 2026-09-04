import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, KeyRound, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAgencyProviderConnections } from '@/hooks/useManagerPortalData'
import {
  connectAgencyProvider,
  disconnectAgencyProvider,
  listAgencyBusinesses,
  selectAgencyBusiness,
  type AgencyProvider,
} from '@/lib/integrations'
import { connectionStatusLabels, connectionStatusStyles } from '@/lib/status-styles'

const PROVIDER_LABELS: Record<AgencyProvider, string> = {
  google_ads: 'Google Ads (MCC)',
  meta_ads: 'Meta Ads (Business Manager)',
}

/** Fase 28 — só existe pro Meta: escolha manual do Business Manager
 * quando a conexão automática (handleAgencyCallback) não conseguiu
 * decidir sozinha (0 ou 2+ encontrados). Mesmo molde de
 * SelectGoogleAdsAccountDialog. */
function SelectAgencyBusinessDialog() {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  const businessesQuery = useQuery({
    queryKey: ['agency-businesses'],
    queryFn: listAgencyBusinesses,
    enabled: open,
  })

  async function handleConfirm() {
    if (!selectedId) return
    setSaving(true)
    try {
      await selectAgencyBusiness(selectedId)
      queryClient.invalidateQueries({ queryKey: ['agency-provider-connections'] })
      toast.success('Business Manager escolhido.')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Building2 className="h-3.5 w-3.5" />
          Escolher Business Manager
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escolher Business Manager</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Essa conta do Meta tem acesso a mais de um Business Manager (ou nenhum foi encontrado) — escolha qual usar como
            conta administradora da agência.
          </p>
          {businessesQuery.isLoading && <p className="text-xs text-muted-foreground">Buscando...</p>}
          {businessesQuery.isError && (
            <p className="text-xs text-destructive">
              {businessesQuery.error instanceof Error ? businessesQuery.error.message : 'Não foi possível buscar.'}
            </p>
          )}
          {businessesQuery.data && (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o Business Manager" />
              </SelectTrigger>
              <SelectContent>
                {businessesQuery.data.length === 0 && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum Business Manager encontrado.</p>
                )}
                {businessesQuery.data.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name ?? b.id} ({b.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter>
          <Button type="button" disabled={!selectedId || saving} onClick={handleConfirm}>
            {saving ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AgencyProviderConnectionsCardProps {
  /** Só admin conecta/desconecta (mesma regra de AgencySettingsTab) —
   * gestor só acompanha o status. */
  canEdit: boolean
}

/** Fase 28 — autentica a conta administradora da agência (MCC no
 * Google Ads, Business Manager no Meta) uma única vez, em vez de cada
 * Ativo Digital de cliente fazer o próprio OAuth. Depois de conectada,
 * o diálogo "Conectar integração" de um Ativo Digital passa a mostrar
 * uma lista de contas em vez de pedir login de novo (ver
 * ConnectIntegrationDialog.tsx). */
export function AgencyProviderConnectionsCard({ canEdit }: AgencyProviderConnectionsCardProps) {
  const { data: connections, isLoading, isError } = useAgencyProviderConnections()
  const [connectingProvider, setConnectingProvider] = useState<AgencyProvider | null>(null)
  const [disconnectingProvider, setDisconnectingProvider] = useState<AgencyProvider | null>(null)

  async function handleConnect(provider: AgencyProvider) {
    setConnectingProvider(provider)
    try {
      const authorizationUrl = await connectAgencyProvider(provider)
      window.location.href = authorizationUrl
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível iniciar a conexão.')
      setConnectingProvider(null)
    }
  }

  async function handleDisconnect(provider: AgencyProvider) {
    setDisconnectingProvider(provider)
    try {
      await disconnectAgencyProvider(provider)
      toast.success('Conta administradora desconectada.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível desconectar.')
    } finally {
      setDisconnectingProvider(null)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  function connectionFor(provider: AgencyProvider) {
    return (connections ?? []).find((c) => c.provider === provider)
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-purple-400" />
          Contas administradoras (Google Ads / Meta Ads)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0 pt-4">
        <p className="text-xs text-muted-foreground">
          Conecte a conta administradora do Google Ads (MCC) e o Business Manager do Meta uma única vez — depois disso, cada
          cliente escolhe a própria conta numa lista, sem precisar logar de novo. O vínculo entre a conta do cliente e o
          MCC/Business Manager precisa ser feito antes, manualmente, dentro do próprio Google Ads/Meta.
        </p>

        {isError && <p className="text-sm text-destructive">Erro ao carregar o status das conexões. Tente novamente.</p>}

        {(['google_ads', 'meta_ads'] as const).map((provider) => {
          const connection = connectionFor(provider)
          const status = connection?.status ?? 'disconnected'
          return (
            <div key={provider} className="space-y-2 rounded-lg bg-secondary/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{PROVIDER_LABELS[provider]}</span>
                <Badge className={connectionStatusStyles[status] ?? ''}>{connectionStatusLabels[status] ?? status}</Badge>
              </div>

              {!canEdit && <p className="text-xs text-muted-foreground">Só o admin pode conectar ou desconectar.</p>}

              {canEdit && status !== 'connected' && (
                <Button type="button" size="sm" disabled={connectingProvider === provider} onClick={() => handleConnect(provider)}>
                  {connectingProvider === provider ? 'Redirecionando...' : `Conectar ${PROVIDER_LABELS[provider]}`}
                </Button>
              )}

              {canEdit && status === 'connected' && (
                <div className="flex flex-wrap items-center gap-2">
                  {provider === 'meta_ads' && !connection?.external_account_id && <SelectAgencyBusinessDialog />}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disconnectingProvider === provider}
                    onClick={() => handleDisconnect(provider)}
                  >
                    <Unplug className="h-3.5 w-3.5" />
                    {disconnectingProvider === provider ? 'Desconectando...' : 'Desconectar'}
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
