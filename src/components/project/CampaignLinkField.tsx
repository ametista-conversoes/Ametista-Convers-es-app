import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllDigitalAssets, useDigitalAssetConnections } from '@/hooks/useManagerPortalData'
import { listCampaigns } from '@/lib/integrations'

const PROVIDER_LABELS: Record<string, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
}

interface CampaignLinkValue {
  externalConnectionId: string | null
  externalCampaignId: string | null
  externalCampaignName: string | null
}

interface CampaignLinkFieldProps {
  clientId: string
  value: CampaignLinkValue
  onChange: (value: CampaignLinkValue) => void
}

/** Campo opcional pra vincular um projeto a uma campanha real de uma
 * conta já conectada (Meta Ads/Google Ads) — Fase 8.1b. Reaproveitado
 * em `NewProjectDialog` e na aba Campanha de `ProjectDetailDialog`. Se
 * o cliente não tem nenhuma integração de anúncios conectada, não
 * mostra nada (a não ser que já exista um vínculo antigo, pra dar pra
 * desvincular mesmo assim). */
export function CampaignLinkField({ clientId, value, onChange }: CampaignLinkFieldProps) {
  const { data: assets } = useAllDigitalAssets()
  const { data: connections } = useDigitalAssetConnections()
  const [pendingConnectionId, setPendingConnectionId] = useState<string>(value.externalConnectionId ?? '')

  useEffect(() => {
    setPendingConnectionId(value.externalConnectionId ?? '')
  }, [value.externalConnectionId])

  const clientAssetIds = new Set((assets ?? []).filter((a) => a.client_id === clientId).map((a) => a.id))
  const availableConnections = (connections ?? []).filter(
    (c) => (c.provider === 'google_ads' || c.provider === 'meta_ads') && c.status === 'connected' && clientAssetIds.has(c.digital_asset_id),
  )

  const campaignsQuery = useQuery({
    queryKey: ['campaigns-list', pendingConnectionId],
    queryFn: () => listCampaigns(pendingConnectionId),
    enabled: !!pendingConnectionId,
  })

  if (availableConnections.length === 0 && !value.externalCampaignId) {
    return null
  }

  if (value.externalCampaignId) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-sm">
        <span className="flex items-center gap-2 text-foreground">
          <Link2 className="h-4 w-4 text-purple-400" />
          Campanha vinculada: {value.externalCampaignName ?? value.externalCampaignId}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange({ externalConnectionId: null, externalCampaignId: null, externalCampaignName: null })}
        >
          <Unlink className="h-3.5 w-3.5" />
          Desvincular
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Select
        value={pendingConnectionId}
        onValueChange={(connectionId) => {
          setPendingConnectionId(connectionId)
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Escolha a conta de anúncios" />
        </SelectTrigger>
        <SelectContent>
          {availableConnections.map((connection) => {
            const asset = (assets ?? []).find((a) => a.id === connection.digital_asset_id)
            return (
              <SelectItem key={connection.id} value={connection.id}>
                {asset?.name ?? 'Ativo digital'} — {PROVIDER_LABELS[connection.provider] ?? connection.provider}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      {pendingConnectionId && (
        <>
          {campaignsQuery.isLoading && <p className="text-xs text-muted-foreground">Buscando campanhas...</p>}
          {campaignsQuery.isError && (
            <p className="text-xs text-destructive">
              {campaignsQuery.error instanceof Error ? campaignsQuery.error.message : 'Não foi possível buscar as campanhas.'}
            </p>
          )}
          {campaignsQuery.data && (
            <Select
              value=""
              onValueChange={(campaignId) => {
                const campaign = campaignsQuery.data.find((c) => c.id === campaignId)
                onChange({
                  externalConnectionId: pendingConnectionId,
                  externalCampaignId: campaignId,
                  externalCampaignName: campaign?.name ?? campaignId,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha a campanha" />
              </SelectTrigger>
              <SelectContent>
                {campaignsQuery.data.length === 0 && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">Nenhuma campanha encontrada nessa conta.</p>
                )}
                {campaignsQuery.data.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </>
      )}
    </div>
  )
}
