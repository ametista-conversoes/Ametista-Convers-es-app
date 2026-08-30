import { useState } from 'react'
import {
  Activity,
  CheckCircle2,
  DollarSign,
  Eye,
  Gauge,
  MousePointerClick,
  Percent,
  Receipt,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { MetricDetailDialog } from '@/components/dashboard/MetricDetailDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ManagerClientRecord } from '@/hooks/useManagerPortalData'
import { useClientPerformanceSnapshots } from '@/hooks/useManagerPortalData'
import { formatCurrency, formatMultiplier, formatNumber, formatPercent } from '@/lib/format'
import { kpiDescriptions } from '@/lib/kpi-descriptions'
import { aggregateSnapshotKpis, buildMetricSeries, computeRevenueFromLeads, computeRoas, type MetricKey } from '@/lib/metrics'

interface MetricDetailConfig {
  label: string
  currentValue: number | null
  formatValue: (value: number | null) => string
}

interface ClientPerformanceMetricsCardProps {
  client: ManagerClientRecord
}

/** Fase 23b — antes só dava pra achar Receita/Lucro/CPA/etc de um
 * cliente perguntando pra Cassie ou vendo um alerta de limiar disparar
 * (Fase 21.2); esse card traz tudo isso de uma vez na Central de
 * Informações, com as MESMAS fórmulas já usadas no Dashboard/Relatórios
 * do próprio cliente (`aggregateSnapshotKpis`/`computeRevenueFromLeads`/
 * `computeRoas`) — nunca mostra um número diferente do que o cliente já
 * vê do lado dele. Clique em qualquer card abre o mesmo detalhe com
 * gráfico já usado no resto do app (Fases 22/23). */
export function ClientPerformanceMetricsCard({ client }: ClientPerformanceMetricsCardProps) {
  const { data: snapshots, isLoading } = useClientPerformanceSnapshots(client.id)
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null)

  const snapshotList = snapshots ?? []
  const kpis = aggregateSnapshotKpis(snapshotList)
  const revenue = computeRevenueFromLeads(kpis.conversions, client.leads_to_close, client.average_ticket)
  const roas = revenue != null ? computeRoas(revenue, kpis.spend) : null
  // Mesma fórmula do FinancialSummaryCard/Histórico Mensal — Lucro
  // desconta a mensalidade da agência, não só o investimento em mídia.
  const totalCost = kpis.spend + (client.monthly_fee ?? 0)
  const profit = revenue != null ? revenue - totalCost : null

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
  const selectedMetricConfig = selectedMetric ? metricConfigs[selectedMetric] : undefined

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4 text-purple-400" />
          Métricas de Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0 pt-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="content-grid-container">
            <div className="content-grid gap-4">
              <KpiCard
                label="Investimento"
                value={formatCurrency(kpis.spend)}
                icon={DollarSign}
                description={kpiDescriptions.investimento}
                onClick={() => setSelectedMetric('spend')}
              />
              <KpiCard
                label="Gasto Total"
                value={formatCurrency(totalCost)}
                icon={Receipt}
                description={kpiDescriptions.gastoTotal}
              />
              <KpiCard
                label="Receita"
                value={formatCurrency(revenue)}
                icon={TrendingUp}
                description={kpiDescriptions.receita}
                onClick={() => setSelectedMetric('revenue')}
              />
              <KpiCard label="Lucro" value={formatCurrency(profit)} icon={Wallet} description={kpiDescriptions.lucro} />
              <KpiCard
                label="ROAS"
                value={formatMultiplier(roas)}
                icon={Gauge}
                description={kpiDescriptions.roas}
                onClick={() => setSelectedMetric('roas')}
              />
              <KpiCard
                label="CPA"
                value={formatCurrency(kpis.cpa)}
                icon={Target}
                description={kpiDescriptions.cpa}
                onClick={() => setSelectedMetric('cpa')}
              />
              <KpiCard
                label="CTR médio"
                value={formatPercent(kpis.ctr)}
                icon={MousePointerClick}
                description={kpiDescriptions.ctrMedio}
                onClick={() => setSelectedMetric('ctr')}
              />
              <KpiCard
                label="CPC"
                value={formatCurrency(kpis.cpc)}
                icon={Target}
                description={kpiDescriptions.cpc}
                onClick={() => setSelectedMetric('cpc')}
              />
              <KpiCard
                label="Taxa de Conversão"
                value={formatPercent(kpis.conversionRate)}
                icon={Percent}
                description={kpiDescriptions.taxaConversao}
                onClick={() => setSelectedMetric('conversionRate')}
              />
              <KpiCard
                label="Cliques"
                value={formatNumber(kpis.clicks)}
                icon={MousePointerClick}
                description={kpiDescriptions.cliques}
                onClick={() => setSelectedMetric('clicks')}
              />
              <KpiCard
                label="Impressões"
                value={formatNumber(kpis.impressions)}
                icon={Eye}
                description={kpiDescriptions.impressoes}
                onClick={() => setSelectedMetric('impressions')}
              />
              <KpiCard
                label="Conversões"
                value={formatNumber(kpis.conversions)}
                icon={CheckCircle2}
                description={kpiDescriptions.conversoes}
                onClick={() => setSelectedMetric('conversions')}
              />
              <KpiCard
                label="Health Score"
                value={formatNumber(client.health_score)}
                icon={Activity}
                description={kpiDescriptions.healthScoreMedio}
              />
            </div>
          </div>
        )}
      </CardContent>

      {selectedMetric && selectedMetricConfig && (
        <MetricDetailDialog
          open
          onOpenChange={(open) => !open && setSelectedMetric(null)}
          label={selectedMetricConfig.label}
          currentValue={selectedMetricConfig.currentValue}
          series={buildMetricSeries(snapshotList, selectedMetric, client.leads_to_close, client.average_ticket)}
          formatValue={selectedMetricConfig.formatValue}
        />
      )}
    </Card>
  )
}
