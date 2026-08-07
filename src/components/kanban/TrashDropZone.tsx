import { useDroppable } from '@dnd-kit/core'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const TRASH_DROPPABLE_ID = 'trash'

/** Zona de lixeira do Kanban — só aparece com o "modo de exclusão" da
 * página ligado. Arrastar um card até aqui e soltar apaga a tarefa (em
 * vez de mudar o status). O ícone anima quando o card passa por cima. */
export function TrashDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: TRASH_DROPPABLE_ID })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-[65vh] w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-destructive/30 bg-destructive/5 transition-colors',
        isOver && 'border-destructive bg-destructive/15',
      )}
    >
      <Trash2
        className={cn(
          'h-8 w-8 text-destructive/60 transition-transform duration-200',
          isOver && 'scale-125 -rotate-6 text-destructive',
        )}
      />
      <p className="px-2 text-center text-xs text-destructive/80">Solte aqui para apagar</p>
    </div>
  )
}
