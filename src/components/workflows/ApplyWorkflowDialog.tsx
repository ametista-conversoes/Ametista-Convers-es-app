import { useState } from 'react'
import { Workflow as WorkflowIcon } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllClients, useAllProjects, useApplyWorkflow } from '@/hooks/useManagerPortalData'
import type { WorkflowTemplate } from '@/lib/workflow-templates'

interface ApplyWorkflowDialogProps {
  template: WorkflowTemplate
}

export function ApplyWorkflowDialog({ template }: ApplyWorkflowDialogProps) {
  const [open, setOpen] = useState(false)
  const [projectId, setProjectId] = useState('')
  const { data: clients } = useAllClients()
  const { data: projects } = useAllProjects()
  const applyWorkflow = useApplyWorkflow()

  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]))

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setProjectId('')
  }

  async function handleApply() {
    const project = (projects ?? []).find((p) => p.id === projectId)
    if (!project) return
    try {
      await applyWorkflow.mutateAsync({ clientId: project.client_id, projectId: project.id, steps: template.steps })
      toast.success(`${template.steps.length} tarefas criadas no Kanban.`)
      setOpen(false)
      setProjectId('')
    } catch {
      toast.error('Não foi possível aplicar o workflow.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <WorkflowIcon className="h-4 w-4" />
          Aplicar Workflow
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar "{template.name}"</DialogTitle>
          <DialogDescription>
            Cria {template.steps.length} tarefas em Backlog, uma para cada etapa do modelo, no projeto escolhido.
          </DialogDescription>
        </DialogHeader>

        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um projeto" />
          </SelectTrigger>
          <SelectContent>
            {(projects ?? []).map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {clientNameById.get(project.client_id) ?? 'Cliente'} — {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button disabled={!projectId || applyWorkflow.isPending} onClick={handleApply}>
            {applyWorkflow.isPending ? 'Aplicando...' : 'Aplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
