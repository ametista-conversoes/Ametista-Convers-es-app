import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TIME_SLOTS: string[] = []
for (let hour = 8; hour <= 19; hour++) {
  for (const minute of ['00', '30']) {
    TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:${minute}`)
  }
}

interface TimeSlotSelectProps {
  value: string
  onValueChange: (value: string) => void
}

export function TimeSlotSelect({ value, onValueChange }: TimeSlotSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um horário" />
      </SelectTrigger>
      <SelectContent>
        {TIME_SLOTS.map((slot) => (
          <SelectItem key={slot} value={slot}>
            {slot}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
