import { useState } from 'react'
import {
  Activity,
  CheckCircle2,
  DollarSign,
  Download,
  Eye,
  Gauge,
  MousePointerClick,
  Percent,
  Target,
  TrendingUp,
} from 'lucide-react'
import { PerformanceTrendChart } from '@/components/charts/PerformanceTrendChart'
import { SpendRevenueBarChart } from '@/components/charts/SpendRevenueBarChart'
import { FinancialSummaryCard } from '@/components/dashboard/FinancialSummaryCard'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { MonthYearPicker } from '@/components/reports/MonthYearPicker'
import { UnlinkedClientNotice } from '@/components/shared/UnlinkedClientNotice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useClient, useMonthlyReport, usePerformanceSnapshots, useProjects } from '@/hooks/useClientPortalData'
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from '@/lib/format'
import { kpiDescriptions } from '@/lib/kpi-descriptions'
import {
  aggregateSnapshotKpis,
  aggregateSnapshotKpisForMonth,
  buildTrendSeries,
  computeRevenueFromLeads,
  computeRoas,
  groupByChannel,
} from '@/lib/metrics'
import { generateMonthlyReportPdf, type MonthlyReportPdfData } from '@/lib/pdf-report'

const now = new Date()

export default function Reports() {
  const { clientId } = useAuth()
  const { data: client, isLoading: loadingClient, isError: clientIsError } = useClient()
  const { data: projects, isLoading: loadingProjects, isError: projectsIsError } = useProjects()
  const { data: snapshots, isLoading: loadingSnapshots, isError: snapshotsIsError } = usePerformanceSnapshots()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const { data: monthlyReport, isLoading: loadingMonthlyReport } = useMonthlyReport(selectedYear, selectedMonth)

  if (!clientId) {
    return <UnlinkedClientNotice page="Relatórios" />
  }

  if (loadingClient || loadingProjects || loadingSnapshots) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (clientIsError || projectsIsError || snapshotsIsError) {
    return <p className="text-sm text-destructive">Erro ao carregar os dados. Tente novamente.</p>
  }

  const projectList = projects ?? []
  const snapshotList = snapshots ?? []
  const kpis = aggregateSnapshotKpis(snapshotList)
  const revenue = computeRevenueFromLeads(kpis.conversions, client?.leads_to_close ?? null, client?.average_ticket ?? null)
  const roas = revenue != null ? computeRoas(revenue, kpis.spend) : null
  const channelData = groupByChannel(projectList)
  const trendData = buildTrendSeries(snapshotList)

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1
  let monthlyData: MonthlyReportPdfData | null = null
  if (monthlyReport) {
    monthlyData = {
      spend: monthlyReport.spend,
      revenue: monthlyReport.revenue,
      roas: monthlyReport.roas,
      cpa: monthlyReport.cpa,
      ctr: monthlyReport.ctr,
      clicks: monthlyReport.clicks,
      impressions: monthlyReport.impressions,
      conversions: monthlyReport.conversions,
      health_score: monthlyReport.health_score,
    }
  } else if (isCurrentMonth) {
    const liveKpis = aggregateSnapshotKpisForMonth(snapshotList, selectedYear, selectedMonth)
    const liveRevenue = computeRevenueFromLeads(liveKpis.conversions, client?.leads_to_close ?? null, client?.average_ticket ?? null)
    monthlyData = {
      spend: liveKpis.spend,
      revenue: liveRevenue,
      roas: liveRevenue != null ? computeRoas(liveRevenue, liveKpis.spend) : null,
      cpa: liveKpis.cpa,
      ctr: liveKpis.ctr,
      clicks: liveKpis.clicks,
      impressions: liveKpis.impressions,
      conversions: liveKpis.conversions,
      health_score: client?.health_score ?? null,
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Portal Cliente</p>
        <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
      </div>

      <Tabs defaultValue="traffic">
        <TabsList>
          <TabsTrigger value="traffic">Performance de Tráfego</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="channels">Distribuição &amp; Canais</TabsTrigger>
          <TabsTrigger value="monthly">Histórico Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <div className="content-grid-container">
            <div className="content-grid gap-4">
              <KpiCard
                label="CTR médio"
                value={formatPercent(kpis.ctr)}
                icon={MousePointerClick}
                description={kpiDescriptions.ctrMedio}
              />
              <KpiCard label="ROAS" value={formatMultiplier(roas)} icon={Gauge} description={kpiDescriptions.roas} />
              <KpiCard
                label="Impressões"
                value={formatNumber(kpis.impressions)}
                icon={Eye}
                description={kpiDescriptions.impressoes}
              />
              <KpiCard
                label="Cliques"
                value={formatNumber(kpis.clicks)}
                icon={MousePointerClick}
                description={kpiDescriptions.cliques}
              />
              <KpiCard label="CPC" value={formatCurrency(kpis.cpc)} icon={Target} description={kpiDescriptions.cpc} />
              <KpiCard
                label="Taxa de Conversão"
                value={formatPercent(kpis.conversionRate)}
                icon={Percent}
                description={kpiDescriptions.taxaConversao}
              />
            </div>
          </div>
          <Card className="min-w-0 overflow-hidden rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Tendência de tráfego</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              {trendData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda não há histórico diário registrado.</p>
              ) : (
                <PerformanceTrendChart data={trendData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
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
                value={formatCurrency(revenue)}
                icon={TrendingUp}
                description={kpiDescriptions.receita}
              />
              <KpiCard label="CPA" value={formatCurrency(kpis.cpa)} icon={Target} description={kpiDescriptions.cpa} />
              <KpiCard
                label="Conversões"
                value={formatNumber(kpis.conversions)}
                icon={CheckCircle2}
                description={kpiDescriptions.conversoes}
              />
              <KpiCard
                label="Health Score"
                value={formatNumber(client?.health_score ?? null)}
                icon={Activity}
                description={kpiDescriptions.healthScoreMedio}
              />
            </div>
          </div>
          <FinancialSummaryCard monthlyFee={client?.monthly_fee ?? null} spend={kpis.spend} revenue={revenue} />
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthYearPicker
              year={selectedYear}
              month={selectedMonth}
              onChange={(year, month) => {
                setSelectedYear(year)
                setSelectedMonth(month)
              }}
            />
            {client && monthlyData && (
              <Button onClick={() => generateMonthlyReportPdf(client, monthlyData!, selectedYear, selectedMonth)}>
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
            )}
          </div>

          {loadingMonthlyReport ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !monthlyData ? (
            <p className="text-sm text-muted-foreground">Sem dados para este mês.</p>
          ) : (
            <>
              {isCurrentMonth && !monthlyReport && (
                <p className="text-xs text-muted-foreground">
                  Mês em andamento — fechamento oficial no dia 1º do próximo mês.
                </p>
              )}
              <div className="content-grid-container">
                <div className="content-grid gap-4">
                  <KpiCard
                    label="Investimento"
                    value={formatCurrency(monthlyData.spend)}
                    icon={DollarSign}
                    description={kpiDescriptions.investimento}
                  />
                  <KpiCard
                    label="Receita"
                    value={formatCurrency(monthlyData.revenue)}
                    icon={TrendingUp}
                    description={kpiDescriptions.receita}
                  />
                  <KpiCard label="ROAS" value={formatMultiplier(monthlyData.roas)} icon={Gauge} description={kpiDescriptions.roas} />
                  <KpiCard label="CPA" value={formatCurrency(monthlyData.cpa)} icon={Target} description={kpiDescriptions.cpa} />
                  <KpiCard
                    label="CTR médio"
                    value={formatPercent(monthlyData.ctr)}
                    icon={MousePointerClick}
                    description={kpiDescriptions.ctrMedio}
                  />
                  <KpiCard
                    label="Conversões"
                    value={formatNumber(monthlyData.conversions)}
                    icon={CheckCircle2}
                    description={kpiDescriptions.conversoes}
                  />
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
