import { Activity, CheckCircle2, DollarSign, Gauge, MousePointerClick, Target, TrendingUp } from 'lucide-react'
import { PerformanceTrendChart } from '@/components/charts/PerformanceTrendChart'
import { SpendRevenueBarChart } from '@/components/charts/SpendRevenueBarChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { useAuth } from '@/contexts/AuthContext'
import { useProjects, usePerformanceSnapshots } from '@/hooks/useClientPortalData'
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from '@/lib/format'
import { kpiDescriptions } from '@/lib/kpi-descriptions'
import { aggregateProjectKpis, averageCtr, averageHealthScore, buildTrendSeries, groupByChannel } from '@/lib/metrics'

export default function Performance() {
  const { clientId } = useAuth()
  const { data: projects, isLoading: loadingProjects } = useProjects()
  const { data: snapshots, isLoading: loadingSnapshots } = usePerformanceSnapshots()

  if (!clientId) {
    return (
      <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6 text-sm text-muted-foreground">
        Esta conta não está vinculada a nenhum cliente, então não há dados de Performance para mostrar.
      </div>
    )
  }

  if (loadingProjects || loadingSnapshots) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const projectList = projects ?? []
  const kpis = aggregateProjectKpis(projectList)
  const ctr = averageCtr(projectList)
  const healthAvg = averageHealthScore(projectList)
  const channelData = groupByChannel(projectList)
  const trendData = buildTrendSeries(snapshots ?? [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Portal Cliente</p>
        <h1 className="text-2xl font-semibold text-foreground">Performance</h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">Marketing</h2>
        <div className="content-grid-container">
          <div className="content-grid gap-4">
            <KpiCard
              label="CTR médio"
              value={formatPercent(ctr)}
              icon={MousePointerClick}
              description={kpiDescriptions.ctrMedio}
            />
            <KpiCard label="ROAS" value={formatMultiplier(kpis.roas)} icon={Gauge} description={kpiDescriptions.roas} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">Financeiro</h2>
        <div className="content-grid-container">
          <div className="content-grid gap-4">
            <KpiCard
              label="Investimento"
              value={formatCurrency(kpis.spend)}
              icon={DollarSign}
              description={kpiDescriptions.investimento}
            />
            <KpiCard
              label="Receita"
              value={formatCurrency(kpis.revenue)}
              icon={TrendingUp}
              description={kpiDescriptions.receita}
            />
            <KpiCard label="CPA" value={formatCurrency(kpis.cpa)} icon={Target} description={kpiDescriptions.cpa} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">Negócio</h2>
        <div className="content-grid-container">
          <div className="content-grid gap-4">
            <KpiCard
              label="Conversões"
              value={formatNumber(kpis.conversions)}
              icon={CheckCircle2}
              description={kpiDescriptions.conversoes}
            />
            <KpiCard
              label="Health Score médio"
              value={healthAvg !== null ? formatNumber(healthAvg) : '—'}
              icon={Activity}
              description={kpiDescriptions.healthScoreMedio}
            />
          </div>
        </div>
      </section>

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          <Card className="min-w-0 overflow-hidden rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Investimento vs. Receita por canal</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              {channelData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum projeto com canal definido ainda.</p>
              ) : (
                <SpendRevenueBarChart data={channelData} />
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Tendência</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              {trendData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda não há histórico diário registrado.</p>
              ) : (
                <PerformanceTrendChart data={trendData} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
