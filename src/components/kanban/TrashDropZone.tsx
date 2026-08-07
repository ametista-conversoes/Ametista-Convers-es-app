import { useDroppable } from '@dnd-kit/core'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const TRASH_DROPPABLE_ID = 'trash'

/** Zona de lixeira do Kanban — só aparece com o "modo de exclusão" da
 * página ligado. Fica FORA da fileira rolável de colunas (largura
 * total, abaixo do quadro) para não exigir rolagem horizontal pra
 * alcançar — senão o card é solto fora dela e parece que "não funciona".
 * Arrastar um card até aqui e soltar apaga a tarefa (em vez de mudar o
 * status). O ícone anima quando o card passa por cima. */
export function TrashDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: TRASH_DROPPABLE_ID })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-20 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-destructive/30 bg-destructive/5 transition-colors',
        isOver && 'border-destructive bg-destructive/15',
      )}
    >
      <Trash2
        className={cn(
          'h-6 w-6 text-destructive/60 transition-transform duration-200',
          isOver && 'scale-125 -rotate-6 text-destructive',
        )}
      />
      <p className="text-sm text-destructive/80">Solte aqui para apagar</p>
    </div>
  )
}
