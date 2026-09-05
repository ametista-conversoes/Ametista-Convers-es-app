import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface BulkDeleteToggleProps {
  active: boolean
  selectedCount: number
  isDeleting?: boolean
  /** Ex: "tarefa" / "tarefas", "item" / "itens". */
  nounSingular: string
  nounPlural: string
  /** Adjetivo no singular e no masculino/feminino certo pro substantivo
   * acima (ex: "selecionada" pra tarefa, "selecionado" pra item) — o
   * componente cuida do plural sozinho. */
  selectedAdjective: string
  onActivate: () => void
  onRequestExit: () => void
  onConfirmDelete: () => Promise<void>
}

/** Lixeira de cabeçalho pra apagar vários itens de uma vez (Kanban,
 * Atividades). 1º clique liga o modo de seleção (cada card/linha ganha a
 * própria lixeira, que só marca/desmarca, sem apagar nada ainda). 2º
 * clique: se algo estiver marcado, pede confirmação e apaga tudo de uma
 * vez; se nada estiver marcado, só desliga o modo de seleção. Diferente
 * do `DeleteModeToggle`/`DeleteItemButton` (apagam um item de cada vez,
 * usados em Clientes/Workflows). */
export function BulkDeleteToggle({
  active,
  selectedCount,
  isDeleting,
  nounSingular,
  nounPlural,
  selectedAdjective,
  onActivate,
  onRequestExit,
  onConfirmDelete,
}: BulkDeleteToggleProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const noun = selectedCount > 1 ? nounPlural : nounSingular
  const adjective = selectedCount > 1 ? `${selectedAdjective}s` : selectedAdjective

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
              ? `Selecionar ${nounPlural} para apagar`
              : selectedCount > 0
                ? `Apagar ${selectedCount} ${noun} selecionadas`
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
            {selectedCount} {adjective}
          </span>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Apagar {selectedCount} {noun}?
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
