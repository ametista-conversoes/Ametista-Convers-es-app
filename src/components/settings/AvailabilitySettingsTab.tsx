import { CalendarClock } from 'lucide-react'
import { TIME_SLOTS } from '@/components/meetings/TimeSlotSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAvailabilityBlocks, useToggleAvailabilityBlock } from '@/hooks/useManagerAvailability'
import { cn } from '@/lib/utils'

const WEEKDAYS = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

/** Grade semanal de disponibilidade (Fase 6.5.1) — os horários
 * marcados como indisponíveis aqui bloqueiam o cliente Dominação de
 * escolhê-los ao pedir uma reunião de emergência (ver
 * request_emergency_meeting no banco e EmergencyMeetingDialog.tsx). */
export function AvailabilitySettingsTab() {
  const { data: blocks, isLoading } = useAvailabilityBlocks()
  const toggleBlock = useToggleAvailabilityBlock()

  const blockedSet = new Set((blocks ?? []).map((b) => `${b.weekday}-${b.time_slot}`))

  function isBlocked(weekday: number, timeSlot: string) {
    return blockedSet.has(`${weekday}-${timeSlot}`)
  }

  function handleToggle(weekday: number, timeSlot: string) {
    toggleBlock.mutate({ weekday, timeSlot, blocked: !isBlocked(weekday, timeSlot) })
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-purple-400" />
          Disponibilidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        <p className="text-sm text-muted-foreground">
          Clique nos horários em que você não está disponível. Eles ficam bloqueados pra clientes do plano Dominação
          na hora de pedir uma reunião de emergência.
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left font-normal text-muted-foreground">Horário</th>
                  {WEEKDAYS.map((day) => (
                    <th key={day.value} className="p-1 text-center font-normal text-muted-foreground">
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot}>
                    <td className="p-1 text-muted-foreground">{slot}</td>
                    {WEEKDAYS.map((day) => {
                      const blocked = isBlocked(day.value, slot)
                      return (
                        <td key={day.value} className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(day.value, slot)}
                            className={cn(
                              'h-5 w-full rounded border transition-colors',
                              blocked
                                ? 'border-destructive/30 bg-destructive/20 hover:bg-destructive/30'
                                : 'border-[#1A2540] bg-secondary/40 hover:border-purple-600/30',
                            )}
                            aria-label={`${day.label} ${slot} — ${blocked ? 'indisponível' : 'disponível'}`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
