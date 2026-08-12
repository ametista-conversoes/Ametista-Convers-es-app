const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return currencyFormatter.format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return numberFormatter.format(value)
}

export function formatMultiplier(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${decimalFormatter.format(value)}x`
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${decimalFormatter.format(value)}%`
}

/** "AAAA-MM-DD" sem horário é interpretado pelo JS como meia-noite UTC, que em
 * fusos negativos (Brasil inteiro) volta pro dia anterior ao formatar — fixar
 * o horário ao meio-dia local evita esse salto de um dia pra trás. */
function parseLocalDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return dateFormatter.format(parseLocalDate(value))
}

export function formatFullDate(value: string | null | undefined): string {
  if (!value) return '—'
  return fullDateFormatter.format(parseLocalDate(value))
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return dateTimeFormatter.format(new Date(value))
}

/** Data de hoje no formato "AAAA-MM-DD", usada como `min` em campos `type="date"`. */
export function getTodayIsoDate(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

/** Quão perto do prazo uma meta SMART está: atrasada (já passou), urgente
 * (até 1 mês) ou imediato (até 3 meses). `null` se não há prazo ou a meta
 * já foi concluída — nesses casos não faz sentido mostrar urgência. */
export function getGoalDeadlineStatus(
  targetDate: string | null | undefined,
  status: string,
): 'overdue' | 'urgent' | 'upcoming' | null {
  if (!targetDate || status === 'completed') return null

  const today = new Date(getTodayIsoDate())
  const target = new Date(targetDate)
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays <= 30) return 'urgent'
  if (diffDays <= 90) return 'upcoming'
  return null
}
