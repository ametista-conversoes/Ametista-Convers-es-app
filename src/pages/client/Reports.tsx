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
  Receipt,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { PerformanceTrendChart } from '@/components/charts/PerformanceTrendChart'
import { SpendRevenueBarChart } from '@/components/charts/SpendRevenueBarChart'
import { FinancialSummaryCard } from '@/components/dashboard/FinancialSummaryCard'
import { GoalsProgressCard } from '@/components/dashboard/GoalsProgressCard'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { MetricDetailDialog } from '@/components/dashboard/MetricDetailDialog'
import { MonthYearPicker } from '@/components/reports/MonthYearPicker'
import { UnlinkedClientNotice } from '@/components/shared/UnlinkedClientNotice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useClient, useMonthlyReport, usePerformanceSnapshots, useProjects, useSmartGoals } from '@/hooks/useClientPortalData'
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from '@/lib/format'
import { kpiDescriptions } from '@/lib/kpi-descriptions'
import {
  aggregateSnapshotKpis,
  aggregateSnapshotKpisForMonth,
  buildMetricSeries,
  buildTrendSeries,
  computeRevenueFromLeads,
  computeRoas,
  groupByChannel,
  groupByChannelForMonth,
  type MetricKey,
} from '@/lib/metrics'
import { generateMonthlyReportPdf, type MonthlyReportPdfData } from '@/lib/pdf-report'

const now = new Date()

interface MetricDetailConfig {
  label: string
  currentValue: number | null
  formatValue: (value: number | null) => string
}

export default function Reports() {
  const { clientId } = useAuth()
  const { data: client, isLoading: loadingClient, isError: clientIsError } = useClient()
  const { data: projects, isLoading: loadingProjects, isError: projectsIsError } = useProjects()
  const { data: snapshots, isLoading: loadingSnapshots, isError: snapshotsIsError } = usePerformanceSnapshots()
  const { data: goals, isLoading: loadingGoals, isError: goalsIsError } = useSmartGoals()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  // "all" = histórico inteiro (abas Tráfego/Financeiro), "month" = só o
  // mês selecionado no seletor (aba Histórico Mensal) — mesmo card
  // (CPA, por exemplo) mostra um gráfico diferente dependendo de onde
  // foi clicado.
  const [selectedMetric, setSelectedMetric] = useState<{ key: MetricKey; scope: 'all' | 'month' } | null>(null)
  const { data: monthlyReport, isLoading: loadingMonthlyReport } = useMonthlyReport(selectedYear, selectedMonth)

  if (!clientId) {
    return <UnlinkedClientNotice page="Relatórios" />
  }

  if (loadingClient || loadingProjects || loadingSnapshots || loadingGoals) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (clientIsError || projectsIsError || snapshotsIsError || goalsIsError) {
    return <p className="text-sm text-destructive">Erro ao carregar os dados. Tente novamente.</p>
  }

  const projectList = projects ?? []
  const snapshotList = snapshots ?? []
  const kpis = aggregateSnapshotKpis(snapshotList)
  const revenue = computeRevenueFromLeads(kpis.conversions, client?.leads_to_close ?? null, client?.average_ticket ?? null)
  const roas = revenue != null ? computeRoas(revenue, kpis.spend) : null
  const channelData = groupByChannel(projectList)
  const trendData = buildTrendSeries(snapshotList)

  const metricConfigs: Record<MetricKey, MetricDetailConfig> = {
    spend: { label: 'Investimento', currentValue: kpis.spend, formatValue: formatCurrency },
    revenue: { label: 'Receita', currentValue: revenue, formatValue: formatCurrency },
    roas: { label: 'ROAS', currentValue: roas, formatValue: formatMultiplier },
    cpa: { label: 'CPA', currentValue: kpis.cpa, formatValue: formatCurrency },
    conversions: { label: 'Conversões', currentValue: kpis.conversions, formatValue: formatNumber },
    ctr: { label: 'CTR médio', currentValue: kpis.ctr, formatValue: formatPercent },
    cpc: { label: 'CPC', currentValue: kpis.cpc, formatValue: formatCurrency },
    conversionRate: { label: 'Taxa de Conversão', currentValue: kpis.conversionRate, formatValue: formatPercent },
    impressions: { label: 'Impressões', currentValue: kpis.impressions, formatValue: formatNumber },
    clicks: { label: 'Cliques', currentValue: kpis.clicks, formatValue: formatNumber },
  }

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1
  let monthlyData: MonthlyReportPdfData | null = null
  if (monthlyReport) {
    monthlyData = {
      spend: monthlyReport.spend,
      revenue: monthlyReport.revenue,
      monthlyFee: client?.monthly_fee ?? null,
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
      monthlyFee: client?.monthly_fee ?? null,
      roas: liveRevenue != null ? computeRoas(liveRevenue, liveKpis.spend) : null,
      cpa: liveKpis.cpa,
      ctr: liveKpis.ctr,
      clicks: liveKpis.clicks,
      impressions: liveKpis.impressions,
      conversions: liveKpis.conversions,
      health_score: client?.health_score ?? null,
    }
  }
  // Mesma fórmula do FinancialSummaryCard (aba Financeiro) — Lucro
  // desconta a mensalidade da agência, não só o investimento em mídia.
  const monthlyTotalCost = (monthlyData?.spend ?? 0) + (monthlyData?.monthlyFee ?? 0)
  const monthlyProfit = monthlyData?.revenue != null ? monthlyData.revenue - monthlyTotalCost : null
  const monthChannelData = groupByChannelForMonth(
    snapshotList,
    selectedYear,
    selectedMonth,
    client?.leads_to_close ?? null,
    client?.average_ticket ?? null,
  )
  const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
  const monthSnapshots = snapshotList.filter((s) => s.snapshot_date.startsWith(monthPrefix))
  const monthTrendData = buildTrendSeries(monthSnapshots)

  // Config dos cards clicáveis da aba "Histórico Mensal" — "Gasto
  // Total" e "Lucro" ficam de fora (dependem da mensalidade, um valor
  // só do mês inteiro, sem jeito natural de virar uma série diária).
  const monthlyMetricConfigs: Partial<Record<MetricKey, MetricDetailConfig>> = monthlyData
    ? {
        spend: { label: 'Investimento', currentValue: monthlyData.spend, formatValue: formatCurrency },
        revenue: { label: 'Receita', currentValue: monthlyData.revenue, formatValue: formatCurrency },
        roas: { label: 'ROAS', currentValue: monthlyData.roas, formatValue: formatMultiplier },
        cpa: { label: 'CPA', currentValue: monthlyData.cpa, formatValue: formatCurrency },
        ctr: { label: 'CTR médio', currentValue: monthlyData.ctr, formatValue: formatPercent },
        conversions: { label: 'Conversões', currentValue: monthlyData.conversions, formatValue: formatNumber },
      }
    : {}

  const selectedMetricConfig = selectedMetric
    ? selectedMetric.scope === 'month'
      ? monthlyMetricConfigs[selectedMetric.key]
      : metricConfigs[selectedMetric.key]
    : undefined
  const selectedMetricSeries = selectedMetric
    ? buildMetricSeries(
        selectedMetric.scope === 'month' ? monthSnapshots : snapshotList,
        selectedMetric.key,
        client?.leads_to_close ?? null,
        client?.average_ticket ?? null,
      )
    : []

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
                onClick={() => setSelectedMetric({ key: 'ctr', scope: 'all' })}
              />
              <KpiCard
                label="ROAS"
                value={formatMultiplier(roas)}
                icon={Gauge}
                description={kpiDescriptions.roas}
                onClick={() => setSelectedMetric({ key: 'roas', scope: 'all' })}
              />
              <KpiCard
                label="Impressões"
                value={formatNumber(kpis.impressions)}
                icon={Eye}
                description={kpiDescriptions.impressoes}
                onClick={() => setSelectedMetric({ key: 'impressions', scope: 'all' })}
              />
              <KpiCard
                label="Cliques"
                value={formatNumber(kpis.clicks)}
                icon={MousePointerClick}
                description={kpiDescriptions.cliques}
                onClick={() => setSelectedMetric({ key: 'clicks', scope: 'all' })}
              />
              <KpiCard
                label="CPC"
                value={formatCurrency(kpis.cpc)}
                icon={Target}
                description={kpiDescriptions.cpc}
                onClick={() => setSelectedMetric({ key: 'cpc', scope: 'all' })}
              />
              <KpiCard
                label="Taxa de Conversão"
                value={formatPercent(kpis.conversionRate)}
                icon={Percent}
                description={kpiDescriptions.taxaConversao}
                onClick={() => setSelectedMetric({ key: 'conversionRate', scope: 'all' })}
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
                onClick={() => setSelectedMetric({ key: 'spend', scope: 'all' })}
              />
              <KpiCard
                label="Receita"
                value={formatCurrency(revenue)}
                icon={TrendingUp}
                description={kpiDescriptions.receita}
                onClick={() => setSelectedMetric({ key: 'revenue', scope: 'all' })}
              />
              <KpiCard
                label="CPA"
                value={formatCurrency(kpis.cpa)}
                icon={Target}
                description={kpiDescriptions.cpa}
                onClick={() => setSelectedMetric({ key: 'cpa', scope: 'all' })}
              />
              <KpiCard
                label="Conversões"
                value={formatNumber(kpis.conversions)}
                icon={CheckCircle2}
                description={kpiDescriptions.conversoes}
                onClick={() => setSelectedMetric({ key: 'conversions', scope: 'all' })}
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
              <CardTitle className="text-base">Investimento vs. Receita por canal (todos os projetos)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-0 pt-4">
              <p className="text-xs text-muted-foreground">
                Investimento/Receita cadastrados manualmente em cada projeto, somando todo o histórico — diferente do
                gráfico por canal da aba "Histórico Mensal", que usa o dado real sincronizado de um mês específico.
              </p>
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
              <Button
                onClick={() =>
                  generateMonthlyReportPdf(
                    client,
                    monthlyData!,
                    selectedYear,
                    selectedMonth,
                    monthChannelData,
                    monthTrendData,
                    goals ?? [],
                  )
                }
              >
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
                    onClick={() => setSelectedMetric({ key: 'spend', scope: 'month' })}
                  />
                  <KpiCard
                    label="Gasto Total"
                    value={formatCurrency(monthlyTotalCost)}
                    icon={Receipt}
                    description={kpiDescriptions.gastoTotal}
                  />
                  <KpiCard
                    label="Receita"
                    value={formatCurrency(monthlyData.revenue)}
                    icon={TrendingUp}
                    description={kpiDescriptions.receita}
                    onClick={() => setSelectedMetric({ key: 'revenue', scope: 'month' })}
                  />
                  <KpiCard label="Lucro" value={formatCurrency(monthlyProfit)} icon={Wallet} description={kpiDescriptions.lucro} />
                  <KpiCard
                    label="ROAS"
                    value={formatMultiplier(monthlyData.roas)}
                    icon={Gauge}
                    description={kpiDescriptions.roas}
                    onClick={() => setSelectedMetric({ key: 'roas', scope: 'month' })}
                  />
                  <KpiCard
                    label="CPA"
                    value={formatCurrency(monthlyData.cpa)}
                    icon={Target}
                    description={kpiDescriptions.cpa}
                    onClick={() => setSelectedMetric({ key: 'cpa', scope: 'month' })}
                  />
                  <KpiCard
                    label="CTR médio"
                    value={formatPercent(monthlyData.ctr)}
                    icon={MousePointerClick}
                    description={kpiDescriptions.ctrMedio}
                    onClick={() => setSelectedMetric({ key: 'ctr', scope: 'month' })}
                  />
                  <KpiCard
                    label="Conversões"
                    value={formatNumber(monthlyData.conversions)}
                    icon={CheckCircle2}
                    description={kpiDescriptions.conversoes}
                    onClick={() => setSelectedMetric({ key: 'conversions', scope: 'month' })}
                  />
                </div>
              </div>

              <Card className="min-w-0 overflow-hidden rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-base">Investimento vs. Receita por canal (mês selecionado)</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  {monthChannelData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum dado de canal para este mês.</p>
                  ) : (
                    <SpendRevenueBarChart data={monthChannelData} />
                  )}
                </CardContent>
              </Card>

              <Card className="min-w-0 overflow-hidden rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-base">Tendência do mês</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  {monthTrendData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem histórico diário para este mês.</p>
                  ) : (
                    <PerformanceTrendChart data={monthTrendData} />
                  )}
                </CardContent>
              </Card>

              <div>
                <GoalsProgressCard goals={goals ?? []} />
                <p className="mt-2 text-xs text-muted-foreground/70">
                  Metas atuais — mostram a situação de hoje, não um histórico do mês selecionado (as metas SMART não têm
                  fechamento por mês).
                </p>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {selectedMetric && selectedMetricConfig && (
        <MetricDetailDialog
          open
          onOpenChange={(open) => !open && setSelectedMetric(null)}
          label={selectedMetric.scope === 'month' ? `${selectedMetricConfig.label} (mês selecionado)` : selectedMetricConfig.label}
          currentValue={selectedMetricConfig.currentValue}
          series={selectedMetricSeries}
          formatValue={selectedMetricConfig.formatValue}
        />
      )}
    </div>
  )
}
