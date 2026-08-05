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
}

export const clientStatusStyles: Record<string, string> = {
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  onboarding: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
  paused: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  churned: 'border-destructive/20 bg-destructive/10 text-destructive',
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
