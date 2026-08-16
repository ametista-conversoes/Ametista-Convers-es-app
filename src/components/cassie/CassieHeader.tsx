import { useState } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
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
import { CASSIE_MODE_INFO, type CassieMode } from '@/lib/cassie-modes'
import { planLabels } from '@/lib/status-styles'

interface CassieHeaderProps {
  plan?: string | null
  allowedModes: CassieMode[]
  mode: CassieMode
  onModeChange: (mode: CassieMode) => void
  onClearHistory: () => void
  clearing: boolean
  hasMessages: boolean
}

export function CassieHeader({ plan, allowedModes, mode, onModeChange, onClearHistory, clearing, hasMessages }: CassieHeaderProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/15">
          <Sparkles className="h-5 w-5 animate-pulse text-purple-400" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cassie IA</h1>
          <p className="text-xs text-muted-foreground">
            {plan ? `Plano: ${planLabels[plan] ?? plan} · ` : ''}
            Modo: {CASSIE_MODE_INFO[mode].label}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={mode} onValueChange={(v) => onModeChange(v as CassieMode)}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedModes.map((m) => (
              <SelectItem key={m} value={m}>
                {CASSIE_MODE_INFO[m].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={!hasMessages || clearing}>
              <Trash2 className="h-4 w-4" />
              Limpar Histórico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Limpar histórico da conversa?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Todas as mensagens dessa conversa com a Cassie vão ser apagadas. Essa ação não pode ser desfeita.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={clearing}
                onClick={() => {
                  onClearHistory()
                  setConfirmOpen(false)
                }}
              >
                {clearing ? 'Limpando...' : 'Limpar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
