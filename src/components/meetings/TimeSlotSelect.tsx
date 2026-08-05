import { forwardRef } from 'react'
import { Select } from '@/components/ui/select'

const TIME_SLOTS: string[] = []
for (let hour = 8; hour <= 19; hour++) {
  for (const minute of ['00', '30']) {
    TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:${minute}`)
  }
}

export const TimeSlotSelect = forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>((props, ref) => {
  return (
    <Select ref={ref} {...props}>
      <option value="">Selecione um horário</option>
      {TIME_SLOTS.map((slot) => (
        <option key={slot} value={slot}>
          {slot}
        </option>
      ))}
    </Select>
  )
})
TimeSlotSelect.displayName = 'TimeSlotSelect'
