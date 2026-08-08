import { useState } from 'react'
import { Repeat } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useAllClients,
  useClientMeetingRecurrence,
  useEnrollMeetingRecurrence,
  useSetMeetingRecurrenceActive,
} from '@/hooks/useManagerPortalData'
import { planMeetingFrequencyLabels } from '@/lib/status-styles'

export function MeetingRecurrenceDialog() {
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const { data: clients } = useAllClients()
  const { data: recurrence, isLoading } = useClientMeetingRecurrence(clientId || null)
  const enroll = useEnrollMeetingRecurrence()
  const setActive = useSetMeetingRecurrenceActive()

  const client = (clients ?? []).find((c) => c.id === clientId)
  const frequencyLabel = client?.plan ? planMeetingFrequencyLabels[client.plan] : null
  const isActive = recurrence?.active ?? false

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setClientId('')
  }

  async function handleEnable() {
    try {
      await enroll.mutateAsync(clientId)
      toast.success('Recorrência ativada — 3 reuniões já foram criadas.')
    } catch {
      toast.error('Não foi possível ativar a recorrência.')
    }
  }

  async function handleDisable() {
    try {
      await setActive.mutateAsync({ clientId, active: false })
      toast.success('Recorrência desativada.')
    } catch {
      toast.error('Não foi possível desativar a recorrência.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Repeat className="h-4 w-4" />
          Configurar recorrência
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reuniões automáticas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escolha um cliente pra ativar reuniões automáticas "Reunião", sempre mantendo 3 futuras agendadas — a
            frequência é definida pelo plano do cliente e é atualizada sozinha se o plano mudar.
          </p>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {(clients ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {clientId && !client?.plan && (
            <p className="text-sm text-destructive">
              Esse cliente ainda não tem um plano definido. Configure o plano na Central de Informações antes de
              ativar a recorrência.
            </p>
          )}

          {clientId && client?.plan && !isLoading && (
            <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
              <p className="text-foreground">
                Frequência: <span className="font-medium">{frequencyLabel}</span>
              </p>
              <p className="text-muted-foreground">Status: {isActive ? 'Ativa' : 'Inativa'}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          {clientId &&
            client?.plan &&
            (isActive ? (
              <Button variant="outline" onClick={handleDisable} disabled={setActive.isPending}>
                {setActive.isPending ? 'Desativando...' : 'Desativar recorrência'}
              </Button>
            ) : (
              <Button onClick={handleEnable} disabled={enroll.isPending}>
                {enroll.isPending ? 'Ativando...' : 'Ativar recorrência'}
              </Button>
            ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
