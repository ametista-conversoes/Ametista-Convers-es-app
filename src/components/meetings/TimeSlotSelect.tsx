import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const TIME_SLOTS: string[] = []
for (let hour = 8; hour <= 19; hour++) {
  for (const minute of ['00', '30']) {
    TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:${minute}`)
  }
}

interface TimeSlotSelectProps {
  value: string
  onValueChange: (value: string) => void
  /** Horários pra tirar da lista (ex: bloqueados nas Configurações de
   * disponibilidade do gestor — ver EmergencyMeetingDialog.tsx). */
  excludeSlots?: string[]
}

export function TimeSlotSelect({ value, onValueChange, excludeSlots }: TimeSlotSelectProps) {
  const slots = excludeSlots?.length ? TIME_SLOTS.filter((slot) => !excludeSlots.includes(slot)) : TIME_SLOTS

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um horário" />
      </SelectTrigger>
      <SelectContent>
        {slots.map((slot) => (
          <SelectItem key={slot} value={slot}>
            {slot}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
