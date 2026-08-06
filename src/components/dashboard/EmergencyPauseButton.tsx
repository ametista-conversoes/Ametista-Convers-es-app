import { useState } from 'react'
import { Pause } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useTriggerEmergencyPause } from '@/hooks/useClientPortalData'

export function EmergencyPauseButton() {
  const [open, setOpen] = useState(false)
  const triggerEmergencyPause = useTriggerEmergencyPause()

  async function handleConfirm() {
    try {
      await triggerEmergencyPause.mutateAsync()
      toast.success('Pausa de emergência registrada. A agência foi notificada.')
      setOpen(false)
    } catch {
      toast.error('Não foi possível registrar a pausa de emergência.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Pause className="h-4 w-4" />
          Pausa de Emergência
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Pausa de Emergência</DialogTitle>
          <DialogDescription>
            Isso abre um incidente crítico para a agência atender com prioridade máxima. Use só em situações
            urgentes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" disabled={triggerEmergencyPause.isPending} onClick={handleConfirm}>
            {triggerEmergencyPause.isPending ? 'Registrando...' : 'Confirmar pausa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
