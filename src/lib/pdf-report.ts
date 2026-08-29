import { jsPDF } from 'jspdf'
import type { ClientRecord } from '@/hooks/useClientPortalData'
import { formatCurrency, formatMultiplier, formatNumber, formatPercent, MONTH_LABELS } from '@/lib/format'

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

/** Fase 21.3 — monta e baixa o PDF do fechamento mensal, 100% no
 * navegador (jsPDF), sem round-trip de backend. */
export function generateMonthlyReportPdf(client: ClientRecord, data: MonthlyReportPdfData, year: number, month: number) {
  const doc = new jsPDF()
  const monthLabel = `${MONTH_LABELS[month - 1]} de ${year}`

  doc.setFontSize(18)
  doc.text('Ametista Conversões', 14, 20)
  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text('Relatório mensal de performance', 14, 27)

  doc.setTextColor(0)
  doc.setFontSize(11)
  doc.text(`Cliente: ${client.name}${client.company ? ` (${client.company})` : ''}`, 14, 40)
  doc.text(`Período: ${monthLabel}`, 14, 47)
  doc.text(`Gerado em: ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`, 14, 54)

  const rows: Array<[string, string]> = [
    ['Investimento', formatCurrency(data.spend)],
    ['Receita', formatCurrency(data.revenue)],
    ['ROAS', formatMultiplier(data.roas)],
    ['CPA', formatCurrency(data.cpa)],
    ['CTR', formatPercent(data.ctr)],
    ['Cliques', formatNumber(data.clicks)],
    ['Impressões', formatNumber(data.impressions)],
    ['Conversões', formatNumber(data.conversions)],
    ['Health Score', formatNumber(data.health_score)],
  ]

  let y = 68
  doc.setFontSize(13)
  doc.text('Métricas do mês', 14, y)
  y += 8
  doc.setFontSize(11)
  for (const [label, value] of rows) {
    doc.text(label, 14, y)
    doc.text(value, 100, y)
    y += 8
  }

  const fileClientName = client.name.trim().replace(/\s+/g, '-').toLowerCase()
  doc.save(`relatorio-${fileClientName}-${year}-${String(month).padStart(2, '0')}.pdf`)
}
