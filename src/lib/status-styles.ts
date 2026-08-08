// Rótulos e cores de badge para os campos de status/prioridade/severidade
// vindos do banco (Fase 3). Centralizados aqui porque as mesmas listas
// vão reaparecer em várias telas nas próximas sub-fases.

export const taskStatusLabels: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'A fazer',
  in_progress: 'Em andamento',
  review: 'Em revisão',
  done: 'Concluída',
}

export const taskStatusStyles: Record<string, string> = {
  backlog: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
  todo: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  in_progress: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  review: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
  done: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
}

export const taskPriorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

export const meetingStatusLabels: Record<string, string> = {
  scheduled: 'Agendada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

export const meetingStatusStyles: Record<string, string> = {
  scheduled: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  completed: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  cancelled: 'border-destructive/20 bg-destructive/10 text-destructive',
}

export const incidentStatusLabels: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

export const incidentStatusStyles: Record<string, string> = {
  open: 'border-destructive/20 bg-destructive/10 text-destructive',
  in_progress: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  resolved: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  closed: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
}

export const severityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
}

export const severityStyles: Record<string, string> = {
  low: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
  medium: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  high: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
  critical: 'border-destructive/20 bg-destructive/10 text-destructive',
}

// Usado pra ordenar incidentes/alertas com os mais severos primeiro
// (número maior = mais severo).
export const severityRank: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}

export const roleLabels: Record<string, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
  cliente: 'Cliente',
}

export const roleStyles: Record<string, string> = {
  admin: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
  gestor: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  cliente: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
}

export const clientStatusLabels: Record<string, string> = {
  active: 'Ativo',
  onboarding: 'Onboarding',
  paused: 'Pausado',
  churned: 'Encerrado',
  at_risk: 'Em risco',
}

export const clientStatusStyles: Record<string, string> = {
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  onboarding: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  paused: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  churned: 'border-destructive/20 bg-destructive/10 text-destructive',
  at_risk: 'border-destructive/20 bg-destructive/10 text-destructive',
}

// Badge extra e automático (não é um status salvo — calculado em
// src/lib/client-risk.ts) mostrado junto do status manual do cliente.
export const clientProblemStatusStyle = 'border-orange-500/20 bg-orange-500/10 text-orange-400'
export const clientProblemStatusLabel = 'Em problemas'

// Planos fixos do cliente (Fase 5.5) — chave estável salva no banco,
// rótulo em português só existe aqui no front.
export const planLabels: Record<string, string> = {
  validacao: 'Validação',
  escala: 'Escala',
  dominacao: 'Dominação',
}

export const planStyles: Record<string, string> = {
  validacao: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  escala: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  dominacao: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
}

// Frequência de reuniões automáticas ligada a cada plano — ver
// "meeting_recurrence_interval" no banco (mesmo mapeamento dos dois lados).
export const planMeetingFrequencyLabels: Record<string, string> = {
  validacao: 'Mensal',
  escala: 'Quinzenal',
  dominacao: 'Semanal',
}

export function getHealthScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-foreground'
  if (score < 50) return 'text-destructive'
  if (score < 70) return 'text-amber-400'
  return 'text-emerald-400'
}

export const projectStatusLabels: Record<string, string> = {
  planning: 'Planejamento',
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const projectStatusStyles: Record<string, string> = {
  planning: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  paused: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  completed: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
  cancelled: 'border-destructive/20 bg-destructive/10 text-destructive',
}

export const reviewStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  revision_requested: 'Revisão pedida',
}

export const reviewStatusStyles: Record<string, string> = {
  pending: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  approved: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  rejected: 'border-destructive/20 bg-destructive/10 text-destructive',
  revision_requested: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
}

export const smartGoalStatusLabels: Record<string, string> = {
  on_track: 'No caminho certo',
  at_risk: 'Em risco',
  off_track: 'Fora da rota',
  completed: 'Concluída',
}

export const smartGoalStatusStyles: Record<string, string> = {
  on_track: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  at_risk: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  off_track: 'border-destructive/20 bg-destructive/10 text-destructive',
  completed: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
}

export const digitalAssetStatusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Pendente',
  revoked: 'Revogado',
}

export const digitalAssetStatusStyles: Record<string, string> = {
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  inactive: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
  pending: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  revoked: 'border-destructive/20 bg-destructive/10 text-destructive',
}

export const digitalAssetTypeLabels: Record<string, string> = {
  business_manager: 'Business Manager',
  ad_account: 'Conta de Anúncios',
  pixel: 'Pixel',
  tag: 'Tag',
  domain: 'Domínio',
  other: 'Outro',
}

// Tipos de ativo cujo acesso é por código/snippet, não por link.
export const digitalAssetCodeTypes = ['pixel', 'tag']

export const goalDeadlineStatusLabels: Record<string, string> = {
  overdue: 'Atrasada',
  urgent: 'Urgente',
  upcoming: 'Imediato',
}

export const goalDeadlineStatusStyles: Record<string, string> = {
  overdue: 'border-destructive/20 bg-destructive/10 text-destructive',
  urgent: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
  upcoming: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
}

export const smartGoalMetricLabels: Record<string, string> = {
  cpa: 'CPA',
  roas: 'ROAS',
  cpc: 'CPC',
  ctr: 'CTR',
  cpm: 'CPM',
  leads: 'Leads',
  conversoes: 'Conversões',
  faturamento: 'Faturamento',
  ticket_medio: 'Ticket Médio',
  taxa_conversao: 'Taxa de Conversão',
}
