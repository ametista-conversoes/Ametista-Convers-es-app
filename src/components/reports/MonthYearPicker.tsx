import { useState } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MONTH_LABELS } from '@/lib/format'
import { cn } from '@/lib/utils'

const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface MonthYearPickerProps {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

/** Seletor de mês/ano granular (Fase 21.3) — diferente do `DatePicker`
 * (que escolhe um dia), aqui a unidade é o mês inteiro, pra escolher
 * qual "fechamento mensal" ver na aba Relatórios. Não deixa escolher
 * mês futuro (ainda não existe fechamento pra ele). */
export function MonthYearPicker({ year, month, onChange }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(year)
  const now = new Date()
  const isFuture = (y: number, m: number) => y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setViewYear(year)
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-9 justify-start gap-2 border-input bg-background font-normal">
          <CalendarIcon className="h-4 w-4" />
          {MONTH_LABELS[month - 1]} de {year}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="mb-3 flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewYear((y) => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground">{viewYear}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={viewYear >= now.getFullYear()}
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTH_ABBR.map((label, index) => {
            const m = index + 1
            const disabled = isFuture(viewYear, m)
            const selected = viewYear === year && m === month
            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(viewYear, m)
                  setOpen(false)
                }}
                className={cn(
                  'rounded-lg px-2 py-1.5 text-sm transition-colors',
                  disabled && 'cursor-not-allowed text-muted-foreground/40',
                  !disabled && !selected && 'text-foreground hover:bg-secondary',
                  selected && 'bg-purple-600/15 text-purple-400',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
