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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useAllClients,
  useAllProjects,
  useApplyWorkflow,
  useSetClientDefaultWorkflow,
  useWorkflowTemplates,
} from '@/hooks/useManagerPortalData'
import type { WorkflowTemplateRecord } from '@/hooks/useManagerPortalData'

interface ApplyWorkflowDialogProps {
  /** Vindo do card do Workflow em Workflows.tsx — trava o template, deixa escolher o cliente. */
  template?: WorkflowTemplateRecord
  /** Vindo da Central de Informações do Cliente — trava o cliente, deixa escolher o template
   * (pré-selecionado com o padrão do cliente, se houver um definido). */
  lockedClientId?: string
}

type Target = 'project' | 'kanban'

export function ApplyWorkflowDialog({ template: fixedTemplate, lockedClientId }: ApplyWorkflowDialogProps) {
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState(lockedClientId ?? '')
  const [templateId, setTemplateId] = useState('')
  const [target, setTarget] = useState<Target | ''>('')
  const [projectId, setProjectId] = useState('')
  const [markAsDefault, setMarkAsDefault] = useState(false)

  const { data: clients } = useAllClients()
  const { data: projects } = useAllProjects()
  const { data: templates } = useWorkflowTemplates()
  const applyWorkflow = useApplyWorkflow()
  const setDefaultWorkflow = useSetClientDefaultWorkflow()

  const effectiveClientId = lockedClientId ?? clientId
  const client = (clients ?? []).find((c) => c.id === effectiveClientId)
  const template = fixedTemplate ?? (templates ?? []).find((t) => t.id === templateId)
  const clientProjects = (projects ?? []).filter((p) => p.client_id === effectiveClientId)

  function resetSelections() {
    if (!lockedClientId) setClientId('')
    if (!fixedTemplate) setTemplateId('')
    setTarget('')
    setProjectId('')
    setMarkAsDefault(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && lockedClientId) {
      const lockedClient = (clients ?? []).find((c) => c.id === lockedClientId)
      if (lockedClient?.default_workflow_template_id) setTemplateId(lockedClient.default_workflow_template_id)
    }
    if (!next) resetSelections()
  }

  async function handleApply() {
    if (!client || !template || !target) return
    if (target === 'project' && !projectId) return
    try {
      await applyWorkflow.mutateAsync({
        clientId: client.id,
        projectId: target === 'project' ? projectId : null,
        workflowName: template.name,
        steps: template.steps,
        activityTemplateIds: template.activity_template_ids,
      })
      if (markAsDefault) {
        await setDefaultWorkflow.mutateAsync({ clientId: client.id, workflowTemplateId: template.id })
      }
      const activitiesMsg =
        template.activity_template_ids.length > 0 ? ' + itens de checklist criados em Atividades.' : ''
      const destinationMsg = target === 'project' ? 'no projeto escolhido' : 'no Kanban do cliente'
      toast.success(`${template.steps.length} tarefas criadas ${destinationMsg}.${activitiesMsg}`)
      handleOpenChange(false)
    } catch {
      toast.error('Não foi possível aplicar o workflow.')
    }
  }

  const canApply = !!client && !!template && !!target && (target !== 'project' || !!projectId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className={lockedClientId ? undefined : 'w-full'}>
          <WorkflowIcon className="h-4 w-4" />
          Aplicar Workflow
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fixedTemplate ? `Aplicar "${fixedTemplate.name}"` : 'Aplicar Workflow Operacional'}</DialogTitle>
          <DialogDescription>
            {template
              ? `Cria ${template.steps.length} tarefas em Backlog, uma para cada etapa do modelo — o prazo de cada uma (quando o modelo tiver) já nasce calculado a partir de hoje.`
              : 'Escolha um cliente e um modelo pra continuar.'}
            {template &&
              template.activity_template_ids.length > 0 &&
              ' Também cria os itens dos Workflows de Atividades vinculados, na aba Atividades.'}
          </DialogDescription>
        </DialogHeader>

        {!lockedClientId && (
          <Select
            value={clientId}
            onValueChange={(value) => {
              setClientId(value)
              setTarget('')
              setProjectId('')
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {(clients ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {!fixedTemplate && (
          <Select
            value={templateId}
            onValueChange={(value) => {
              setTemplateId(value)
              setTarget('')
              setProjectId('')
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um workflow" />
            </SelectTrigger>
            <SelectContent>
              {(templates ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {client && template && (
          <>
            <Select value={target} onValueChange={(value) => setTarget(value as Target)}>
              <SelectTrigger>
                <SelectValue placeholder="Aplicar em..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Tarefas de um projeto</SelectItem>
                <SelectItem value="kanban">Tarefas do Kanban do cliente</SelectItem>
              </SelectContent>
            </Select>

            {target === 'project' && (
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {clientProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={markAsDefault} onCheckedChange={(checked) => setMarkAsDefault(checked === true)} />
              Marcar esse workflow como padrão desse cliente
            </label>
          </>
        )}

        <DialogFooter>
          <Button disabled={!canApply || applyWorkflow.isPending} onClick={handleApply}>
            {applyWorkflow.isPending ? 'Aplicando...' : 'Aplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
