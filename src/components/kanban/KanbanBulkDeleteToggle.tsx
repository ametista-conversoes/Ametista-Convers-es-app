import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface KanbanBulkDeleteToggleProps {
  active: boolean
  selectedCount: number
  isDeleting?: boolean
  onActivate: () => void
  onRequestExit: () => void
  onConfirmDelete: () => Promise<void>
}

/** Lixeira do cabeçalho do Kanban — 1º clique liga o modo de seleção (cada
 * card ganha a própria lixeira, que só marca/desmarca o card, sem apagar
 * nada ainda). 2º clique: se algum card estiver marcado, pede confirmação
 * e apaga todos de uma vez; se nenhum estiver marcado, só desliga o modo
 * de seleção. Diferente do `DeleteModeToggle`/`DeleteItemButton` (que
 * apagam um item por vez, usados em Clientes/Atividades/Workflows). */
export function KanbanBulkDeleteToggle({
  active,
  selectedCount,
  isDeleting,
  onActivate,
  onRequestExit,
  onConfirmDelete,
}: KanbanBulkDeleteToggleProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleClick() {
    if (!active) {
      onActivate()
      return
    }
    if (selectedCount === 0) {
      onRequestExit()
      return
    }
    setConfirmOpen(true)
  }

  async function handleConfirm() {
    await onConfirmDelete()
    setConfirmOpen(false)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={active ? 'destructive' : 'ghost'}
          size="icon"
          aria-label={
            !active
              ? 'Selecionar tarefas para apagar'
              : selectedCount > 0
                ? `Apagar ${selectedCount} tarefas selecionadas`
                : 'Sair do modo de seleção'
          }
          aria-pressed={active}
          onClick={handleClick}
          className={cn(!active && 'text-muted-foreground')}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        {active && selectedCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {selectedCount} selecionada{selectedCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Apagar {selectedCount} {selectedCount > 1 ? 'tarefas' : 'tarefa'}?
            </DialogTitle>
            <DialogDescription>Essa ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" disabled={isDeleting} onClick={handleConfirm}>
              {isDeleting ? 'Apagando...' : 'Apagar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
