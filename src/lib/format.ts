const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
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

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return dateFormatter.format(new Date(value))
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
