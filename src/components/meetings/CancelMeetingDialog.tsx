import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CancelMeetingDialogProps {
  meetingTitle: string
  onCancel: (reason: string) => Promise<void>
}

/** Botão "Cancelar" de uma reunião agendada — pede o motivo antes de
 * confirmar. Compartilhado pelos dois portais; quem chama decide qual
 * mutation (`useCancelMeeting`) usar via `onCancel`. */
export function CancelMeetingDialog({ meetingTitle, onCancel }: CancelMeetingDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setReason('')
  }

  async function handleConfirm() {
    if (!reason.trim()) return
    setIsSubmitting(true)
    try {
      await onCancel(reason.trim())
      handleOpenChange(false)
    } catch {
      toast.error('Não foi possível cancelar a reunião.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" onClick={(e) => e.stopPropagation()}>
          Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Cancelar "{meetingTitle}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Motivo do cancelamento</Label>
          <Textarea
            id="cancel-reason"
            placeholder="Explique rapidamente o motivo..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="destructive" disabled={!reason.trim() || isSubmitting} onClick={handleConfirm}>
            {isSubmitting ? 'Cancelando...' : 'Confirmar cancelamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
