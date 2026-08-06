import { WorkflowCard } from '@/components/workflows/WorkflowCard'
import { workflowTemplates } from '@/lib/workflow-templates'

export default function Workflows() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Portal Gestor</p>
        <h1 className="text-2xl font-semibold text-foreground">Workflows</h1>
      </div>

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {workflowTemplates.map((template) => (
            <WorkflowCard key={template.key} template={template} />
          ))}
        </div>
      </div>
    </div>
  )
}
