import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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

interface DeleteItemButtonProps {
  label: string
  onDelete: () => Promise<void>
  className?: string
}

/** Ícone de lixeira por item, só renderizado quando o "modo de exclusão"
 * da página (`DeleteModeToggle`) está ligado. Sempre pede confirmação
 * antes de chamar `onDelete`. */
export function DeleteItemButton({ label, onDelete, className }: DeleteItemButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleConfirm() {
    setIsDeleting(true)
    try {
      await onDelete()
      setOpen(false)
    } catch {
      toast.error('Não foi possível apagar.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={className}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Apagar ${label}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Apagar {label}?</DialogTitle>
          <DialogDescription>Essa ação não pode ser desfeita.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" disabled={isDeleting} onClick={handleConfirm}>
            {isDeleting ? 'Apagando...' : 'Apagar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
