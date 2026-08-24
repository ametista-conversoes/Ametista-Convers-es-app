import type { PerformanceSnapshotRecord, ProjectRecord } from '@/hooks/useClientPortalData'
import type { ChannelBreakdown } from '@/components/charts/SpendRevenueBarChart'
import type { TrendPoint } from '@/components/charts/PerformanceTrendChart'

export interface SnapshotTraffic {
  impressions: number
  clicks: number
  cpc: number | null
  conversionRate: number | null
}

export interface AggregatedKpis {
  spend: number
  revenue: number
  roas: number | null
  cpa: number | null
  conversions: number
}

/**
 * Soma bruta dos projetos e recalcula ROAS/CPA a partir dos totais —
 * fazer a média simples dos ROAS/CPA de cada projeto daria um número
 * matematicamente errado quando os projetos têm investimentos diferentes.
 */
export function aggregateProjectKpis(projects: ProjectRecord[]): AggregatedKpis {
  const spend = projects.reduce((sum, p) => sum + (p.spend ?? 0), 0)
  const revenue = projects.reduce((sum, p) => sum + (p.revenue ?? 0), 0)
  const conversions = projects.reduce((sum, p) => {
    if (!p.cpa || p.cpa <= 0 || !p.spend) return sum
    return sum + p.spend / p.cpa
  }, 0)

  return {
    spend,
    revenue,
    roas: spend > 0 ? revenue / spend : null,
    cpa: conversions > 0 ? spend / conversions : null,
    conversions,
  }
}

export function averageCtr(projects: ProjectRecord[]): number | null {
  const withCtr = projects.filter((p) => typeof p.ctr === 'number')
  if (withCtr.length === 0) return null
  return withCtr.reduce((sum, p) => sum + (p.ctr ?? 0), 0) / withCtr.length
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

/**
 * Impressões/cliques/CPC/taxa de conversão somados a partir dos retratos
 * diários (vêm de integrações reais, Google Ads/Meta Ads) — spend usado no
 * CPC é somado dos mesmos snapshots, não do total acumulado do projeto,
 * pra ficar na mesma base de cálculo. Sem cliques, CPC e taxa de conversão
 * ficam null (cliente sem integração conectada ainda).
 */
export function aggregateSnapshotTraffic(snapshots: PerformanceSnapshotRecord[]): SnapshotTraffic {
  const impressions = snapshots.reduce((sum, s) => sum + (s.impressions ?? 0), 0)
  const clicks = snapshots.reduce((sum, s) => sum + (s.clicks ?? 0), 0)
  const conversions = snapshots.reduce((sum, s) => sum + (s.conversions ?? 0), 0)
  const spend = snapshots.reduce((sum, s) => sum + (s.spend ?? 0), 0)

  return {
    impressions,
    clicks,
    cpc: clicks > 0 ? spend / clicks : null,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : null,
  }
}
