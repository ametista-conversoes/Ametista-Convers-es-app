import type { PerformanceSnapshotRecord, ProjectRecord } from '@/hooks/useClientPortalData'
import type { ChannelBreakdown } from '@/components/charts/SpendRevenueBarChart'
import type { TrendPoint } from '@/components/charts/PerformanceTrendChart'

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

export function averageHealthScore(projects: ProjectRecord[]): number | null {
  const withScore = projects.filter((p) => typeof p.health_score === 'number')
  if (withScore.length === 0) return null
  return withScore.reduce((sum, p) => sum + (p.health_score ?? 0), 0) / withScore.length
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
