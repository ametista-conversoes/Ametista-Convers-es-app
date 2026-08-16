import { describe, expect, it } from 'vitest'
import { aggregateProjectKpis } from '@/lib/metrics'
import type { ProjectRecord } from '@/hooks/useClientPortalData'

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

describe('aggregateProjectKpis', () => {
  it('sem projetos, tudo zerado ou sem dado', () => {
    const kpis = aggregateProjectKpis([])
    expect(kpis).toEqual({ spend: 0, revenue: 0, roas: null, cpa: null, conversions: 0 })
  })

  it('soma gasto/receita e recalcula ROAS a partir dos totais (não faz média dos ROAS de cada projeto)', () => {
    const projects = [
      makeProject({ spend: 1000, revenue: 3000, cpa: 50 }),
      makeProject({ spend: 4000, revenue: 4000, cpa: 100 }),
    ]
    const kpis = aggregateProjectKpis(projects)

    expect(kpis.spend).toBe(5000)
    expect(kpis.revenue).toBe(7000)
    expect(kpis.roas).toBeCloseTo(1.4) // 7000 / 5000, não a média (2 e 1)
  })

  it('conversões = gasto ÷ CPA de cada projeto, somado', () => {
    const projects = [makeProject({ spend: 1000, cpa: 50 }), makeProject({ spend: 500, cpa: 25 })]
    const kpis = aggregateProjectKpis(projects)

    expect(kpis.conversions).toBe(40) // (1000/50) + (500/25) = 20 + 20
    expect(kpis.cpa).toBeCloseTo(1500 / 40)
  })

  it('projeto sem CPA (ou CPA zerado) não entra na conta de conversões', () => {
    const projects = [
      makeProject({ spend: 1000, cpa: 50 }), // 20 conversões
      makeProject({ spend: 2000, cpa: null }), // ignorado
      makeProject({ spend: 2000, cpa: 0 }), // ignorado
    ]
    const kpis = aggregateProjectKpis(projects)

    expect(kpis.conversions).toBe(20)
  })
})
