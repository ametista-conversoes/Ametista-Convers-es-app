import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DeleteModeToggleProps {
  active: boolean
  onToggle: () => void
}

/** Liga/desliga o "modo de exclusão" de uma página — enquanto ligado, os
 * cards/linhas da lista mostram seu próprio ícone de lixeira (ver
 * `DeleteItemButton`). Fica ao lado do título "Portal Gestor/Cliente" no
 * topo de cada página que permite apagar itens. */
export function DeleteModeToggle({ active, onToggle }: DeleteModeToggleProps) {
  return (
    <Button
      type="button"
      variant={active ? 'destructive' : 'ghost'}
      size="icon"
      aria-label={active ? 'Sair do modo de exclusão' : 'Ativar modo de exclusão'}
      aria-pressed={active}
      onClick={onToggle}
      className={cn(!active && 'text-muted-foreground')}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
