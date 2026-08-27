import { describe, expect, it } from 'vitest'
import { aggregateSnapshotKpis, computeRoas, sumProjectRevenue } from '@/lib/metrics'
import type { PerformanceSnapshotRecord, ProjectRecord } from '@/hooks/useClientPortalData'

function makeSnapshot(overrides: Partial<PerformanceSnapshotRecord> = {}): PerformanceSnapshotRecord {
  return {
    id: crypto.randomUUID(),
    project_id: crypto.randomUUID(),
    snapshot_date: new Date().toISOString().slice(0, 10),
    spend: null,
    revenue: null,
    roas: null,
    ctr: null,
    channel: null,
    clicks: null,
    impressions: null,
    conversions: null,
    ...overrides,
  }
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function makeProject(overrides: Partial<ProjectRecord> = {}): ProjectRecord {
  return {
    id: crypto.randomUUID(),
    title: 'Projeto',
    status: 'active',
    health_score: null,
    cpa: null,
    roas: null,
    ctr: null,
    spend: null,
    revenue: null,
    channel: null,
    start_date: null,
    end_date: null,
    objective: null,
    icp: null,
    segment: null,
    ...overrides,
  }
}

describe('aggregateSnapshotKpis', () => {
  it('sem snapshots, tudo zerado ou sem dado', () => {
    const kpis = aggregateSnapshotKpis([])
    expect(kpis).toEqual({
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: null,
      cpc: null,
      conversionRate: null,
      cpa: null,
    })
  })

  it('soma spend/impressões/cliques/conversões e calcula CTR, CPC, taxa de conversão e CPA', () => {
    const snapshots = [
      makeSnapshot({ spend: 100, impressions: 1000, clicks: 20, conversions: 4 }),
      makeSnapshot({ spend: 50, impressions: 500, clicks: 10, conversions: 1 }),
    ]
    const kpis = aggregateSnapshotKpis(snapshots)

    expect(kpis.spend).toBe(150)
    expect(kpis.impressions).toBe(1500)
    expect(kpis.clicks).toBe(30)
    expect(kpis.conversions).toBe(5)
    expect(kpis.ctr).toBeCloseTo((30 / 1500) * 100)
    expect(kpis.cpc).toBeCloseTo(150 / 30)
    expect(kpis.conversionRate).toBeCloseTo((5 / 30) * 100)
    expect(kpis.cpa).toBeCloseTo(150 / 5)
  })

  it('ignora snapshots com mais de 30 dias', () => {
    const snapshots = [
      makeSnapshot({ snapshot_date: daysAgo(5), spend: 100, clicks: 10, impressions: 100, conversions: 2 }),
      makeSnapshot({ snapshot_date: daysAgo(40), spend: 999, clicks: 999, impressions: 999, conversions: 999 }),
    ]
    const kpis = aggregateSnapshotKpis(snapshots)

    expect(kpis.spend).toBe(100)
    expect(kpis.clicks).toBe(10)
    expect(kpis.conversions).toBe(2)
  })

  it('sem cliques, CPC/taxa de conversão/CPA ficam null (evita divisão por zero)', () => {
    const kpis = aggregateSnapshotKpis([makeSnapshot({ spend: 100, impressions: 500, clicks: 0, conversions: 0 })])
    expect(kpis.cpc).toBeNull()
    expect(kpis.conversionRate).toBeNull()
    expect(kpis.cpa).toBeNull()
    expect(kpis.ctr).toBe(0)
  })
})

describe('sumProjectRevenue', () => {
  it('soma a receita registrada manualmente em cada projeto, ignorando quem não tem', () => {
    const projects = [makeProject({ revenue: 1000 }), makeProject({ revenue: null }), makeProject({ revenue: 500 })]
    expect(sumProjectRevenue(projects)).toBe(1500)
  })

  it('sem projetos, zero', () => {
    expect(sumProjectRevenue([])).toBe(0)
  })
})

describe('computeRoas', () => {
  it('receita ÷ investimento', () => {
    expect(computeRoas(3000, 1000)).toBeCloseTo(3)
  })

  it('sem investimento, ROAS fica null (evita divisão por zero)', () => {
    expect(computeRoas(3000, 0)).toBeNull()
  })
})
