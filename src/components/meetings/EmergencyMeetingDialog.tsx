import { useState } from 'react'
import { AlertCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAvailabilityBlocks } from '@/hooks/useManagerAvailability'
import { useClient, useRequestEmergencyMeeting, useUpcomingMeetings } from '@/hooks/useClientPortalData'
import { getTodayIsoDate } from '@/lib/format'
import { TimeSlotSelect } from './TimeSlotSelect'

const TODAY = getTodayIsoDate()

function isSameMonth(isoDate: string, reference: Date) {
  const d = new Date(isoDate)
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth()
}

export function EmergencyMeetingDialog() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: client } = useClient()
  const { data: meetings } = useUpcomingMeetings()
  const { data: blocks } = useAvailabilityBlocks()
  const requestEmergencyMeeting = useRequestEmergencyMeeting()

  const isDominacao = client?.plan === 'dominacao'
  const alreadyRequestedThisMonth = (meetings ?? []).some(
    (m) => m.is_emergency && isSameMonth(m.created_at, new Date()),
  )
  const disabled = !isDominacao || alreadyRequestedThisMonth

  const weekday = date ? new Date(`${date}T12:00:00`).getDay() : null
  const excludeSlots =
    weekday !== null ? (blocks ?? []).filter((b) => b.weekday === weekday).map((b) => b.time_slot) : []

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setDate('')
      setTime('')
      setMeetingLink('')
    }
  }

  async function handleSubmit() {
    if (!date) {
      toast.error('Escolha uma data')
      return
    }
    if (!time) {
      toast.error('Escolha um horário')
      return
    }

    setSubmitting(true)
    try {
      await requestEmergencyMeeting.mutateAsync({
        date: new Date(`${date}T${time}`).toISOString(),
        meetingLink: meetingLink.trim() ? meetingLink.trim() : null,
      })
      toast.success('Reunião de emergência solicitada!')
      handleOpenChange(false)
    } catch {
      // erro já avisado pelo onError do hook
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="flex flex-col items-end gap-1">
          <Button disabled={disabled}>
            <Plus className="h-4 w-4" />
            Reunião de emergência
          </Button>
          {disabled && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {!isDominacao
                ? 'Disponível apenas para o plano Dominação'
                : 'Você já solicitou uma reunião de emergência este mês'}
            </p>
          )}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar reunião de emergência</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data</Label>
              <DatePicker
                value={date}
                onChange={(v) => {
                  setDate(v)
                  setTime('')
                }}
                minDate={TODAY}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <TimeSlotSelect value={time} onValueChange={setTime} excludeSlots={excludeSlots} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link da reunião (opcional)</Label>
            <Input
              type="url"
              placeholder="https://meet.exemplo.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Solicitando...' : 'Solicitar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
