import { useState } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string
  onChange: (value: string) => void
  minDate?: string
  placeholder?: string
  disabled?: boolean
}

/** Campo de data com calendário (Popover + react-day-picker). Trabalha com
 * strings no formato "aaaa-mm-dd", igual ao `input[type=date]` que substitui —
 * não muda o formato salvo no banco nem a validação (zod) dos formulários. */
export function DatePicker({ value, onChange, minDate, placeholder = "Selecione uma data", disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined
  const min = minDate ? parseISO(minDate) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start border-input bg-background text-left font-normal hover:bg-background",
            !selected && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {selected ? format(selected, "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return
            onChange(format(date, "yyyy-MM-dd"))
            setOpen(false)
          }}
          disabled={min ? { before: min } : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
