import { Badge } from '@/components/ui/badge'
import { useAdGroups, useCampaignInsights, useCampaignPerformance } from '@/hooks/useManagerPortalData'
import { formatCurrency, formatPercent } from '@/lib/format'
import { ageRangeLabels, dayOfWeekLabels, deviceLabels, genderLabels, hourBucketLabels } from '@/lib/status-styles'
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

interface InsightRow {
  clicks: number
  impressions: number
  conversions: number
}

/** Lista compacta "nome — cliques/conversões", reaproveitada pelos 3
 * resumos curados (top termos de pesquisa, top palavras-chave,
 * geográfico) — todos têm o mesmo formato de linha, só muda o rótulo. */
function InsightRowList<T extends InsightRow>({
  title,
  rows,
  getLabel,
  emptyMessage,
}: {
  title: string
  rows: T[]
  getLabel: (row: T) => string
  emptyMessage: string
}) {
  return (
    <div className="rounded-lg bg-secondary/50 p-3">
      <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">{emptyMessage}</p>}
      {rows.length > 0 && (
        <div className="space-y-1.5">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-sm">
              <p className="truncate text-foreground" title={getLabel(row)}>
                {getLabel(row) || '(não identificado)'}
              </p>
              <p className="shrink-0 text-xs text-muted-foreground">
                {row.clicks} cliques · {row.conversions} conv.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Aba "Grupos de Anúncios" do projeto — busca ao vivo os ad groups da
 * campanha vinculada (Google Ads só, por enquanto). Orçamento e as 2
 * métricas de parcela de impressões perdida ficam no topo, uma vez só,
 * porque são do nível da campanha inteira — o Google Ads não expõe
 * essas 2 no nível de ad group. */
export function AdGroupsTab({ connectionId, campaignId, campaignName, provider }: AdGroupsTabProps) {
  const campaignPerformance = useCampaignPerformance(connectionId, campaignId)
  const adGroupsQuery = useAdGroups(connectionId, campaignId)
  const insightsQuery = useCampaignInsights(connectionId, campaignId)

  // Utilização de orçamento (Nível 2 do documento de dados do Google
  // Ads: "pacing", uso interno da agência) — o orçamento sincronizado é
  // diário, então o teto esperado em 30 dias é orçamento × 30; comparar
  // com o gasto real do período mostra se a campanha está deixando
  // orçamento "na mesa" por falta de demanda/lance, sem precisar abrir
  // o Gerenciador de Anúncios. Não aparece pro cliente (esta tela é só
  // Portal Gestor).
  const budgetAmount = campaignPerformance.data?.budgetAmount ?? null
  const spend30d = campaignPerformance.data?.spend ?? null
  const budgetPacing = budgetAmount && budgetAmount > 0 && spend30d != null ? (spend30d / (budgetAmount * 30)) * 100 : null

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
          <div>
            <p className="text-xs text-muted-foreground">Utilização de orçamento (30 dias)</p>
            <p className="text-foreground">{formatPercent(budgetPacing)}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          Impressão perdida só tem valor real em campanhas de Pesquisa — em Display/Vídeo/Performance Max aparece
          "—". Utilização de orçamento é uso interno (o cliente não vê essa aba) — bem abaixo de 100% pode indicar
          orçamento sobrando por falta de lance/demanda, não necessariamente algo bom.
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

      {insightsQuery.isLoading && <p className="text-sm text-muted-foreground">Buscando resumos da campanha...</p>}
      {insightsQuery.isError && (
        <p className="text-sm text-destructive">
          {insightsQuery.error instanceof Error ? insightsQuery.error.message : 'Não foi possível buscar os resumos da campanha.'}
        </p>
      )}

      {insightsQuery.data && (
        <>
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="mb-2 text-sm font-medium text-foreground">Dispositivo</p>
            {insightsQuery.data.devices.length === 0 && (
              <p className="text-xs text-muted-foreground">Sem dado de dispositivo no período.</p>
            )}
            {insightsQuery.data.devices.length > 0 && (
              <div className="space-y-1.5">
                {insightsQuery.data.devices.map((d) => (
                  <div key={d.device} className="flex items-center justify-between gap-3 text-sm">
                    <p className="text-foreground">{deviceLabels[d.device] ?? d.device}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {formatCurrency(d.spend)} · {d.clicks} cliques · {d.conversions} conv.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <InsightRowList
            title="Desempenho geográfico (cidade/região)"
            rows={insightsQuery.data.geoBreakdown}
            getLabel={(row) => row.name}
            emptyMessage="Sem dado geográfico no período."
          />

          <InsightRowList
            title="Top termos de pesquisa"
            rows={insightsQuery.data.topSearchTerms}
            getLabel={(row) => row.term}
            emptyMessage="Só existe pra campanhas de Pesquisa, ou o Google não revelou os termos deste período."
          />

          <InsightRowList
            title="Top palavras-chave"
            rows={insightsQuery.data.topKeywords}
            getLabel={(row) => row.keyword}
            emptyMessage="Nenhuma palavra-chave com dado no período (comum fora de campanhas de Pesquisa)."
          />

          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="mb-2 text-sm font-medium text-foreground">Breakdown por ação de conversão</p>
            {insightsQuery.data.conversionBreakdown.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Sem conversão registrada no período, ou a campanha não tem ação de conversão configurada.
              </p>
            )}
            {insightsQuery.data.conversionBreakdown.length > 0 && (
              <div className="space-y-1.5">
                {insightsQuery.data.conversionBreakdown.map((c) => (
                  <div key={c.actionName} className="flex items-center justify-between gap-3 text-sm">
                    <p className="truncate text-foreground" title={c.actionName}>
                      {c.actionName}
                    </p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {c.conversions} conv.{c.conversionValue > 0 ? ` · ${formatCurrency(c.conversionValue)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {insightsQuery.data.bestTiming && (
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-sm text-foreground">
                Melhor desempenho: <span className="font-medium">{dayOfWeekLabels[insightsQuery.data.bestTiming.dayOfWeek] ?? insightsQuery.data.bestTiming.dayOfWeek}</span>,
                período da{' '}
                <span className="font-medium">
                  {hourBucketLabels[insightsQuery.data.bestTiming.hourBucket] ?? insightsQuery.data.bestTiming.hourBucket}
                </span>
                .
              </p>
            </div>
          )}

          {(insightsQuery.data.ageRanges.length > 0 || insightsQuery.data.genders.length > 0) && (
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="mb-2 text-sm font-medium text-foreground">Demográfico</p>
              <p className="mb-2 text-[11px] text-muted-foreground/70">
                Só existe em campanhas com segmentação de público (Display/Vídeo/Demand Gen/Performance Max).
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {insightsQuery.data.ageRanges.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Faixa etária</p>
                    <div className="space-y-1">
                      {insightsQuery.data.ageRanges.map((a) => (
                        <div key={a.range} className="flex items-center justify-between gap-2 text-sm">
                          <p className="text-foreground">{ageRangeLabels[a.range] ?? a.range}</p>
                          <p className="text-xs text-muted-foreground">{a.clicks} cliques</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {insightsQuery.data.genders.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Gênero</p>
                    <div className="space-y-1">
                      {insightsQuery.data.genders.map((g) => (
                        <div key={g.gender} className="flex items-center justify-between gap-2 text-sm">
                          <p className="text-foreground">{genderLabels[g.gender] ?? g.gender}</p>
                          <p className="text-xs text-muted-foreground">{g.clicks} cliques</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
