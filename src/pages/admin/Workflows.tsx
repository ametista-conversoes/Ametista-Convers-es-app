import { useAuth } from '@/contexts/AuthContext'
import { WorkflowCard } from '@/components/workflows/WorkflowCard'
import { NewWorkflowTemplateDialog } from '@/components/workflows/NewWorkflowTemplateDialog'
import { useWorkflowTemplates } from '@/hooks/useManagerPortalData'

export default function Workflows() {
  const { role } = useAuth()
  const { data: templates, isLoading } = useWorkflowTemplates()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Workflows</h1>
        </div>
        {role === 'admin' && <NewWorkflowTemplateDialog />}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando modelos...</p>}
      {!isLoading && (templates ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum modelo de workflow cadastrado ainda.</p>
      )}

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {(templates ?? []).map((template) => (
            <WorkflowCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </div>
  )
}
