import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface ApprovalFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitting: boolean
  onConfirm: (feedback: string) => void
}

export function ApprovalFeedbackDialog({
  open,
  onOpenChange,
  title,
  description,
  submitting,
  onConfirm,
}: ApprovalFeedbackDialogProps) {
  const [feedback, setFeedback] = useState('')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFeedback('')
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Descreva o motivo ou o que precisa mudar..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <DialogFooter>
          <Button disabled={!feedback.trim() || submitting} onClick={() => onConfirm(feedback.trim())}>
            {submitting ? 'Enviando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
