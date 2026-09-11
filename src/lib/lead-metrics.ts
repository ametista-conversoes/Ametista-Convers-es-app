// Ametista Conversões — Fase 35, Parte 2 (Fechamento do Loop de Venda):
// pequeno helper compartilhado entre SmartGoalCard e
// UpdateGoalProgressDialog pra não duplicar o "qual contagem de lead
// esse metric_type representa" nos dois lugares.

export interface LeadStatusCounts {
  qualificados: number
  vendas: number
}

/** `null` quando o metric_type da meta não é nenhum dos 2 alimentados
 * por status de lead — nesse caso não faz sentido mostrar sugestão
 * nenhuma. */
export function leadCountForMetric(metricType: string | null, counts: LeadStatusCounts | undefined): number | null {
  if (!counts) return null
  if (metricType === 'leads_qualificados') return counts.qualificados
  if (metricType === 'vendas') return counts.vendas
  return null
}
