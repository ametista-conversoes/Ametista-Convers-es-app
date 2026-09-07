import { Badge } from '@/components/ui/badge'
import { useAdGroups, useCampaignPerformance } from '@/hooks/useManagerPortalData'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

const AD_GROUP_STATUS_LABELS: Record<string, string> = {
  ENABLED: 'Ativo',
  PAUSED: 'Pausado',
  REMOVED: 'Removido',
}

const AD_GROUP_STATUS_STYLES: Record<string, string> = {
  ENABLED: 'bg-emerald-500/10 text-emerald-400',
  PAUSED: 'bg-amber-500/10 text-amber-400',
  REMOVED: 'bg-red-500/10 text-red-400',
}

interface AdGroupsTabProps {
  connectionId: string | null
  campaignId: string | null
  campaignName: string | null
  provider: string | null
}

/** Aba "Grupos de Anúncios" do projeto — busca ao vivo os ad groups da
 * campanha vinculada (Google Ads só, por enquanto). Orçamento e as 2
 * métricas de parcela de impressões perdida ficam no topo, uma vez só,
 * porque são do nível da campanha inteira — o Google Ads não expõe
 * essas 2 no nível de ad group. */
export function AdGroupsTab({ connectionId, campaignId, campaignName, provider }: AdGroupsTabProps) {
  const campaignPerformance = useCampaignPerformance(connectionId, campaignId)
  const adGroupsQuery = useAdGroups(connectionId, campaignId)

  if (!connectionId || !campaignId) {
    return (
      <p className="text-sm text-muted-foreground">
        Vincule uma campanha do Google Ads na aba Campanha pra ver os grupos de anúncios.
      </p>
    )
  }

  if (provider !== 'google_ads') {
    return (
      <p className="text-sm text-muted-foreground">
        Grupos de anúncio só disponíveis pra campanhas do Google Ads por enquanto.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-secondary/50 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Campanha vinculada: {campaignName ?? campaignId}
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Orçamento</p>
            <p className="text-foreground">{formatCurrency(campaignPerformance.data?.budgetAmount ?? null)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Parcela de impressão perdida (classificação)</p>
            <p className="text-foreground">{formatPercent(campaignPerformance.data?.searchRankLostImpressionShare ?? null)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Parcela de impressão perdida (orçamento)</p>
            <p className="text-foreground">{formatPercent(campaignPerformance.data?.searchBudgetLostImpressionShare ?? null)}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          Só têm valor real em campanhas de Pesquisa — em Display/Vídeo/Performance Max aparece "—".
        </p>
      </div>

      {adGroupsQuery.isLoading && <p className="text-sm text-muted-foreground">Buscando grupos de anúncio...</p>}
      {adGroupsQuery.isError && (
        <p className="text-sm text-destructive">
          {adGroupsQuery.error instanceof Error ? adGroupsQuery.error.message : 'Não foi possível buscar os grupos de anúncio.'}
        </p>
      )}
      {adGroupsQuery.data && adGroupsQuery.data.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum grupo de anúncio encontrado nessa campanha.</p>
      )}

      {adGroupsQuery.data && adGroupsQuery.data.length > 0 && (
        <div className="space-y-2">
          {adGroupsQuery.data.map((adGroup) => (
            <div key={adGroup.id} className="rounded-lg bg-secondary/50 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{adGroup.name}</p>
                <Badge className={cn(AD_GROUP_STATUS_STYLES[adGroup.status] ?? '')}>
                  {AD_GROUP_STATUS_LABELS[adGroup.status] ?? adGroup.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3 lg:grid-cols-6">
                <div>
                  <p className="text-xs text-muted-foreground">Custo</p>
                  <p className="text-foreground">{formatCurrency(adGroup.spend)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliques</p>
                  <p className="text-foreground">{adGroup.clicks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CTR</p>
                  <p className="text-foreground">{formatPercent(adGroup.ctr)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CPC méd.</p>
                  <p className="text-foreground">{formatCurrency(adGroup.cpc)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-foreground">{formatPercent(adGroup.conversionRate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Índice de Qualidade</p>
                  <p className="text-foreground">{adGroup.avgQualityScore != null ? adGroup.avgQualityScore.toFixed(1) : '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
