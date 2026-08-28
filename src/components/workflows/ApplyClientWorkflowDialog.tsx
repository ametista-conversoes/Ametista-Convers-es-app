import { useState } from 'react'
import { Workflow as WorkflowIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { ClientWorkflowTemplateRecord } from '@/hooks/useManagerPortalData'
import { useAllClients, useApplyClientWorkflow } from '@/hooks/useManagerPortalData'

interface ApplyClientWorkflowDialogProps {
  template: ClientWorkflowTemplateRecord
}

/** Aplica um modelo de "Workflows do Cliente" a vários clientes de uma
 * vez (em vez de escolher um projeto, como no ApplyWorkflowDialog.tsx
 * operacional) — cada cliente marcado recebe uma tarefa por etapa,
 * sem projeto, com o prazo calculado no banco (apply_client_workflow). */
export function ApplyClientWorkflowDialog({ template }: ApplyClientWorkflowDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const { data: clients } = useAllClients()
  const applyClientWorkflow = useApplyClientWorkflow()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setSelectedClientIds([])
  }

  function toggleClient(clientId: string, checked: boolean) {
    setSelectedClientIds((prev) => (checked ? [...prev, clientId] : prev.filter((id) => id !== clientId)))
  }

  async function handleApply() {
    try {
      await applyClientWorkflow.mutateAsync({ clientIds: selectedClientIds, templateId: template.id })
      toast.success(
        `${template.steps.length} tarefa(s) criadas para ${selectedClientIds.length} cliente(s).`,
      )
      handleOpenChange(false)
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <WorkflowIcon className="h-4 w-4" />
          Aplicar a clientes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar "{template.name}"</DialogTitle>
          <DialogDescription>
            Cria {template.steps.length} tarefa(s) em Backlog pra cada cliente marcado — sem projeto, direto na aba
            "Tarefas" de cada um.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {(clients ?? []).map((client) => (
            <label key={client.id} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
              <Checkbox
                checked={selectedClientIds.includes(client.id)}
                onCheckedChange={(checked) => toggleClient(client.id, checked === true)}
              />
              <span className="text-foreground">{client.name}</span>
            </label>
          ))}
          {(clients ?? []).length === 0 && <Label className="text-muted-foreground">Nenhum cliente cadastrado.</Label>}
        </div>

        <DialogFooter>
          <Button disabled={selectedClientIds.length === 0 || applyClientWorkflow.isPending} onClick={handleApply}>
            {applyClientWorkflow.isPending ? 'Aplicando...' : `Aplicar (${selectedClientIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
