import type { PerformanceSnapshotRecord, ProjectRecord } from '@/hooks/useClientPortalData'
import type { ChannelBreakdown } from '@/components/charts/SpendRevenueBarChart'
import type { TrendPoint } from '@/components/charts/PerformanceTrendChart'

/** Soma a Receita digitada à mão nos projetos — nenhuma plataforma de
 * anúncio reporta faturamento, então é a única fonte que existe. */
export function sumProjectRevenue(projects: ProjectRecord[]): number {
  return projects.reduce((sum, p) => sum + (p.revenue ?? 0), 0)
}

/** ROAS cruza a Receita manual (projetos) com o Investimento real
 * (snapshots) — bases diferentes, mas é o melhor cálculo possível sem
 * as plataformas de anúncio reportarem faturamento. */
export function computeRoas(revenue: number, spend: number): number | null {
  return spend > 0 ? revenue / spend : null
}

/** Agrupa investimento/receita dos projetos por canal, para o gráfico de barras. */
export function groupByChannel(projects: ProjectRecord[]): ChannelBreakdown[] {
  const byChannel = new Map<string, ChannelBreakdown>()
  for (const project of projects) {
    const channel = project.channel ?? 'Sem canal'
    const existing = byChannel.get(channel) ?? { channel, investimento: 0, receita: 0 }
    existing.investimento += project.spend ?? 0
    existing.receita += project.revenue ?? 0
    byChannel.set(channel, existing)
  }
  return Array.from(byChannel.values())
}

/** Soma os retratos diários de todos os projetos do cliente, por data. */
export function buildTrendSeries(snapshots: PerformanceSnapshotRecord[]): TrendPoint[] {
  const byDate = new Map<string, TrendPoint>()
  for (const snapshot of snapshots) {
    const existing = byDate.get(snapshot.snapshot_date) ?? {
      date: snapshot.snapshot_date,
      investimento: 0,
      receita: 0,
    }
    existing.investimento += snapshot.spend ?? 0
    existing.receita += snapshot.revenue ?? 0
    byDate.set(snapshot.snapshot_date, existing)
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export interface SnapshotKpis {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number | null
  cpc: number | null
  conversionRate: number | null
  cpa: number | null
}

const SNAPSHOT_WINDOW_DAYS = 30

/**
 * Investimento/impressões/cliques/conversões/CTR/CPC/taxa de
 * conversão/CPA reais, somados dos últimos 30 dias de retratos diários
 * (vêm de integrações reais, Google Ads/Meta Ads) — mesma janela de 30
 * dias já usada em `useCampaignPerformance` (useManagerPortalData.ts) e
 * no resumo que a Cassie usa, pra não ter duas convenções de período
 * diferentes no app. CTR é calculado na hora (cliques ÷ impressões),
 * não lido de um campo salvo — mesmo padrão de `useCampaignPerformance`.
 * Sem cliques/impressões, os campos derivados ficam null (cliente sem
 * integração conectada ainda).
 */
export function aggregateSnapshotKpis(snapshots: PerformanceSnapshotRecord[]): SnapshotKpis {
  const since = new Date(Date.now() - SNAPSHOT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const recent = snapshots.filter((s) => s.snapshot_date >= since)

  const spend = recent.reduce((sum, s) => sum + (s.spend ?? 0), 0)
  const impressions = recent.reduce((sum, s) => sum + (s.impressions ?? 0), 0)
  const clicks = recent.reduce((sum, s) => sum + (s.clicks ?? 0), 0)
  const conversions = recent.reduce((sum, s) => sum + (s.conversions ?? 0), 0)

  return {
    spend,
    impressions,
    clicks,
    conversions,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
    cpc: clicks > 0 ? spend / clicks : null,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : null,
    cpa: conversions > 0 ? spend / conversions : null,
  }
}
