import { useState } from 'react'
import { Megaphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useManagerClient, useSetClientChosenPlatform } from '@/hooks/useManagerPortalData'
import { supabase } from '@/lib/supabase'

const PLATFORM_LABELS: Record<'meta' | 'google', string> = {
  meta: 'Meta Ads',
  google: 'Google Ads',
}

const NONE_VALUE = 'none'

interface ClientPlatformCardProps {
  clientId: string
}

/** Fase 31 — só clientes do plano Validação escolhem uma única
 * plataforma de anúncio; o checklist de Atividades (ver `Activities.tsx`)
 * usa essa escolha pra mostrar só os itens relevantes (`platform_scope`
 * 'comum' + o da plataforma escolhida). Não renderiza nada pra
 * Escala/Dominação — essa divisão não existe pra eles. */
export function ClientPlatformCard({ clientId }: ClientPlatformCardProps) {
  const { data: client } = useManagerClient(clientId)
  const setChosenPlatform = useSetClientChosenPlatform()
  const [pendingSwitch, setPendingSwitch] = useState<{ next: 'meta' | 'google' | null; completedCount: number } | null>(
    null,
  )
  const [checking, setChecking] = useState(false)

  if (!client || client.plan !== 'validacao') {
    return null
  }

  const currentPlatform = client.chosen_platform

  async function applyChange(next: 'meta' | 'google' | null) {
    try {
      await setChosenPlatform.mutateAsync({ clientId, chosenPlatform: next })
      toast.success(next ? `Plataforma definida como ${PLATFORM_LABELS[next]}.` : 'Plataforma removida.')
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  async function handleChange(value: string) {
    const next = value === NONE_VALUE ? null : (value as 'meta' | 'google')
    if (next === currentPlatform) return

    // Trocar de plataforma esconde os itens concluídos EXCLUSIVOS da
    // plataforma antiga (as 2 marcadas continuam aparecendo do mesmo
    // jeito) — avisa antes, em vez de sumir sem explicação.
    if (currentPlatform) {
      setChecking(true)
      const { data, error } = await supabase
        .from('activity_checklist_items')
        .select('id, platform_scope')
        .eq('client_id', clientId)
        .eq('completed', true)
        .contains('platform_scope', [currentPlatform])
      setChecking(false)
      const exclusiveCount = (data ?? []).filter((item) => item.platform_scope.length === 1).length
      if (!error && exclusiveCount > 0) {
        setPendingSwitch({ next, completedCount: exclusiveCount })
        return
      }
    }

    await applyChange(next)
  }

  async function handleConfirmSwitch() {
    if (!pendingSwitch) return
    await applyChange(pendingSwitch.next)
    setPendingSwitch(null)
  }

  return (
    <>
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-purple-400" />
            Plataforma Escolhida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0 pt-4">
          <p className="text-xs text-muted-foreground">
            Clientes do plano Validação usam só uma plataforma de anúncio — o checklist de Atividades mostra apenas as
            tarefas comuns e as da plataforma escolhida aqui.
          </p>
          <Select
            value={currentPlatform ?? NONE_VALUE}
            onValueChange={handleChange}
            disabled={checking || setChosenPlatform.isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— Ainda não definida —</SelectItem>
              <SelectItem value="meta">Meta Ads</SelectItem>
              <SelectItem value="google">Google Ads</SelectItem>
            </SelectContent>
          </Select>
          {!currentPlatform && (
            <p className="text-xs text-amber-400">
              Sem plataforma definida, as tarefas específicas de Meta/Google ficam ocultas no checklist.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pendingSwitch} onOpenChange={(open) => !open && setPendingSwitch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar de plataforma?</DialogTitle>
            <DialogDescription>
              {pendingSwitch &&
                `Esse cliente já tem ${pendingSwitch.completedCount} tarefa${pendingSwitch.completedCount > 1 ? 's' : ''} concluída${pendingSwitch.completedCount > 1 ? 's' : ''} de ${PLATFORM_LABELS[currentPlatform as 'meta' | 'google']}. Trocar pra ${pendingSwitch.next ? PLATFORM_LABELS[pendingSwitch.next] : 'nenhuma plataforma'} vai esconder essas tarefas do checklist (elas continuam salvas, só não aparecem mais).`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" disabled={setChosenPlatform.isPending} onClick={handleConfirmSwitch}>
              {setChosenPlatform.isPending ? 'Trocando...' : 'Trocar mesmo assim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
