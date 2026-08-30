import { jsPDF } from 'jspdf'
import type { TrendPoint } from '@/components/charts/PerformanceTrendChart'
import type { ChannelBreakdown } from '@/components/charts/SpendRevenueBarChart'
import type { ClientRecord, SmartGoalRecord } from '@/hooks/useClientPortalData'
import { formatCurrency, formatDate, formatMultiplier, formatNumber, formatPercent, MONTH_LABELS } from '@/lib/format'

export interface MonthlyReportPdfData {
  spend: number | null
  revenue: number | null
  roas: number | null
  cpa: number | null
  ctr: number | null
  clicks: number | null
  impressions: number | null
  conversions: number | null
  health_score: number | null
}

const PAGE_BOTTOM = 280

/** Fase 21.3/21.3b/21.3c — monta e baixa o PDF do fechamento mensal,
 * 100% no navegador (jsPDF), sem round-trip de backend. */
export function generateMonthlyReportPdf(
  client: ClientRecord,
  data: MonthlyReportPdfData,
  year: number,
  month: number,
  channelBreakdown: ChannelBreakdown[] = [],
  trendData: TrendPoint[] = [],
  goals: SmartGoalRecord[] = [],
) {
  const doc = new jsPDF()
  const monthLabel = `${MONTH_LABELS[month - 1]} de ${year}`
  const profit = data.revenue != null ? data.revenue - (data.spend ?? 0) : null

  /** Pula pra próxima página se a próxima linha não couber — os
   * blocos do relatório podem crescer bastante (tendência diária,
   * várias metas), então nenhuma seção pode assumir que cabe inteira
   * numa página só. */
  let y = 20
  function ensureSpace(neededHeight: number) {
    if (y + neededHeight > PAGE_BOTTOM) {
      doc.addPage()
      y = 20
    }
  }
  function sectionTitle(title: string) {
    ensureSpace(14)
    doc.setFontSize(13)
    doc.setTextColor(0)
    doc.text(title, 14, y)
    y += 8
    doc.setFontSize(11)
  }

  doc.setFontSize(18)
  doc.text('Ametista Conversões', 14, y)
  y += 7
  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text('Relatório mensal de performance', 14, y)
  y += 13

  doc.setTextColor(0)
  doc.setFontSize(11)
  doc.text(`Cliente: ${client.name}${client.company ? ` (${client.company})` : ''}`, 14, y)
  y += 7
  doc.text(`Período: ${monthLabel}`, 14, y)
  y += 7
  doc.text(`Gerado em: ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`, 14, y)
  y += 14

  const metricRows: Array<[string, string]> = [
    ['Investimento', formatCurrency(data.spend)],
    ['Receita', formatCurrency(data.revenue)],
    ['Lucro', formatCurrency(profit)],
    ['ROAS', formatMultiplier(data.roas)],
    ['CPA', formatCurrency(data.cpa)],
    ['CTR', formatPercent(data.ctr)],
    ['Cliques', formatNumber(data.clicks)],
    ['Impressões', formatNumber(data.impressions)],
    ['Conversões', formatNumber(data.conversions)],
    ['Health Score', formatNumber(data.health_score)],
  ]

  sectionTitle('Métricas do mês')
  for (const [label, value] of metricRows) {
    ensureSpace(8)
    doc.text(label, 14, y)
    doc.text(value, 100, y)
    y += 8
  }

  if (channelBreakdown.length > 0) {
    y += 6
    sectionTitle('Investimento vs. Receita por canal')
    doc.text('Canal', 14, y)
    doc.text('Investimento', 90, y)
    doc.text('Receita (estimada)', 140, y)
    y += 6
    for (const row of channelBreakdown) {
      ensureSpace(7)
      doc.text(row.channel, 14, y)
      doc.text(formatCurrency(row.investimento), 90, y)
      doc.text(formatCurrency(row.receita), 140, y)
      y += 7
    }
  }

  if (trendData.length > 0) {
    y += 6
    sectionTitle('Tendência diária do mês')
    doc.text('Data', 14, y)
    doc.text('Investimento', 90, y)
    doc.text('Receita', 140, y)
    y += 6
    for (const point of trendData) {
      ensureSpace(7)
      doc.text(formatDate(point.date), 14, y)
      doc.text(formatCurrency(point.investimento), 90, y)
      doc.text(formatCurrency(point.receita), 140, y)
      y += 7
    }
  }

  if (goals.length > 0) {
    y += 6
    sectionTitle('Metas — probabilidade de cumprimento')
    for (const goal of goals) {
      ensureSpace(8)
      const target = goal.target_value ?? 0
      const current = goal.current_value ?? 0
      // Fase 21.3c, a pedido do usuário: (já feito ÷ meta) × 100, sem
      // limitar em 100% — passar da meta mostra mais de 100% de
      // propósito, diferente da barra de progresso na tela (essa sim
      // limitada visualmente a 100%, já que é uma barra).
      const probability = target > 0 ? (current / target) * 100 : 0
      doc.text(`${goal.title} — ${current} de ${target}`, 14, y)
      doc.text(`${probability.toFixed(0)}%`, 170, y)
      y += 8
    }
  }

  const fileClientName = client.name.trim().replace(/\s+/g, '-').toLowerCase()
  doc.save(`relatorio-${fileClientName}-${year}-${String(month).padStart(2, '0')}.pdf`)
}
