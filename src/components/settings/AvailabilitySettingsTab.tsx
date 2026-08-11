import { useEffect, useRef, useState } from 'react'
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

function slotKey(weekday: number, timeSlot: string) {
  return `${weekday}-${timeSlot}`
}

/** Grade semanal de disponibilidade (Fase 6.5.1) — os horários
 * marcados como indisponíveis aqui bloqueiam o cliente Dominação de
 * escolhê-los ao pedir uma reunião de emergência (ver
 * request_emergency_meeting no banco e EmergencyMeetingDialog.tsx).
 *
 * Dá pra clicar numa célula só ou clicar e arrastar (segurando o
 * botão esquerdo) pra pintar várias de uma vez — o primeiro clique
 * decide o "sentido" do arrasto (bloquear ou liberar) e as próximas
 * células que o mouse passar por cima seguem o mesmo sentido. As
 * mudanças da sessão de arrasto ficam guardadas localmente
 * (`pendingOverrides`) pra refletir na hora, sem esperar cada
 * confirmação do servidor enquanto o mouse ainda está se movendo.
 */
export function AvailabilitySettingsTab() {
  const { data: blocks, isLoading } = useAvailabilityBlocks()
  const toggleBlock = useToggleAvailabilityBlock()

  const [pendingOverrides, setPendingOverrides] = useState<Map<string, boolean>>(new Map())
  const dragTargetRef = useRef<boolean | null>(null)

  const blockedSet = new Set((blocks ?? []).map((b) => slotKey(b.weekday, b.time_slot)))

  function isBlocked(weekday: number, timeSlot: string) {
    const key = slotKey(weekday, timeSlot)
    return pendingOverrides.has(key) ? (pendingOverrides.get(key) as boolean) : blockedSet.has(key)
  }

  function paint(weekday: number, timeSlot: string, blocked: boolean) {
    setPendingOverrides((prev) => new Map(prev).set(slotKey(weekday, timeSlot), blocked))
    toggleBlock.mutate({ weekday, timeSlot, blocked })
  }

  function handleMouseDown(weekday: number, timeSlot: string) {
    const target = !isBlocked(weekday, timeSlot)
    dragTargetRef.current = target
    paint(weekday, timeSlot, target)
  }

  function handleMouseEnter(weekday: number, timeSlot: string) {
    const target = dragTargetRef.current
    if (target === null) return
    if (isBlocked(weekday, timeSlot) !== target) {
      paint(weekday, timeSlot, target)
    }
  }

  useEffect(() => {
    function handleMouseUp() {
      if (dragTargetRef.current === null) return
      dragTargetRef.current = null
      setPendingOverrides(new Map())
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

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
          Clique num horário em que você não está disponível, ou clique e arraste pra marcar vários de uma vez. Eles
          ficam bloqueados pra clientes do plano Dominação na hora de pedir uma reunião de emergência.
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] select-none border-collapse text-xs">
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
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleMouseDown(day.value, slot)
                            }}
                            onMouseEnter={() => handleMouseEnter(day.value, slot)}
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
