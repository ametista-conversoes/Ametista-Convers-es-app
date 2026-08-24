import { ListChecks, Pencil, Star, StarOff, Workflow as WorkflowIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import type { ActivityTemplateRecord } from '@/hooks/useManagerPortalData'
import {
  useDeleteActivityTemplate,
  useSetDefaultActivityTemplate,
  useUnsetDefaultActivityTemplate,
} from '@/hooks/useManagerPortalData'
import { ActivityTemplateFormDialog } from './ActivityTemplateFormDialog'

interface ActivityTemplateCardProps {
  template: ActivityTemplateRecord
  deleteMode?: boolean
  canEdit?: boolean
  /** Nomes dos Workflows Operacionais que disparam esse Workflow de
   * Atividades ao serem aplicados (ver `activity_template_ids` em
   * `WorkflowTemplateRecord`) — só pra visibilidade, não é salvo aqui. */
  linkedWorkflowNames?: string[]
}

export function ActivityTemplateCard({ template, deleteMode, canEdit, linkedWorkflowNames }: ActivityTemplateCardProps) {
  const deleteTemplate = useDeleteActivityTemplate()
  const setDefault = useSetDefaultActivityTemplate()
  const unsetDefault = useUnsetDefaultActivityTemplate()

  return (
    <Card className="flex flex-col rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-purple-400" />
            {template.name}
          </span>
          <span className="flex items-center gap-1">
            {canEdit && (
              <ActivityTemplateFormDialog
                template={template}
                trigger={
                  <Button type="button" variant="ghost" size="icon" aria-label={`Editar ${template.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
            )}
            {deleteMode && (
              <DeleteItemButton
                label={`o modelo "${template.name}"`}
                onDelete={() => deleteTemplate.mutateAsync(template.id)}
              />
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-0 pt-4">
        <p className="text-sm text-muted-foreground">{template.description}</p>
        {template.is_default && (
          <Badge className="w-fit border-purple-600/20 bg-purple-600/15 text-purple-400">Padrão no cadastro</Badge>
        )}
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <WorkflowIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {linkedWorkflowNames && linkedWorkflowNames.length > 0
            ? `Vinculado a: ${linkedWorkflowNames.join(', ')}`
            : 'Nenhum Workflow Operacional vinculado ainda'}
        </p>
        <ul className="space-y-1.5">
          {template.items.map((item) => (
            <li key={item.title} className="flex items-center gap-2 text-sm text-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {item.title}
            </li>
          ))}
        </ul>
        {canEdit && (
          <div className="mt-auto pt-2">
            {template.is_default ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={unsetDefault.isPending}
                onClick={() => unsetDefault.mutate(template.id)}
              >
                <StarOff className="h-4 w-4" />
                Remover como padrão
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={setDefault.isPending}
                onClick={() => setDefault.mutate(template.id)}
              >
                <Star className="h-4 w-4" />
                Marcar como padrão
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
