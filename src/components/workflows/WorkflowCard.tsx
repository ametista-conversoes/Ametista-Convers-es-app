import { ListChecks } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import type { WorkflowTemplateRecord } from '@/hooks/useManagerPortalData'
import { useDeleteWorkflowTemplate } from '@/hooks/useManagerPortalData'
import { ApplyWorkflowDialog } from './ApplyWorkflowDialog'

interface WorkflowCardProps {
  template: WorkflowTemplateRecord
  deleteMode?: boolean
}

export function WorkflowCard({ template, deleteMode }: WorkflowCardProps) {
  const deleteTemplate = useDeleteWorkflowTemplate()

  return (
    <Card className="flex flex-col rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-purple-400" />
            {template.name}
          </span>
          {deleteMode && (
            <DeleteItemButton label={`o modelo "${template.name}"`} onDelete={() => deleteTemplate.mutateAsync(template.id)} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-0 pt-4">
        <p className="text-sm text-muted-foreground">{template.description}</p>
        <ul className="space-y-1.5">
          {template.steps.map((step) => (
            <li key={step.title} className="flex items-center gap-2 text-sm text-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
              {step.title}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-2">
          <ApplyWorkflowDialog template={template} />
        </div>
      </CardContent>
    </Card>
  )
}
