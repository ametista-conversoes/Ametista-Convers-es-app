import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { WorkflowCard } from '@/components/workflows/WorkflowCard'
import { WorkflowTemplateFormDialog } from '@/components/workflows/WorkflowTemplateFormDialog'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { Button } from '@/components/ui/button'
import { useWorkflowTemplates } from '@/hooks/useManagerPortalData'

export default function Workflows() {
  const { role } = useAuth()
  const { data: templates, isLoading } = useWorkflowTemplates()
  const [deleteMode, setDeleteMode] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Portal Gestor</p>
            <h1 className="text-2xl font-semibold text-foreground">Workflows</h1>
          </div>
          {role === 'admin' && <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />}
        </div>
        {role === 'admin' && (
          <WorkflowTemplateFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Novo modelo
              </Button>
            }
          />
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando modelos...</p>}
      {!isLoading && (templates ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum modelo de workflow cadastrado ainda.</p>
      )}

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {(templates ?? []).map((template) => (
            <WorkflowCard
              key={template.id}
              template={template}
              deleteMode={role === 'admin' && deleteMode}
              canEdit={role === 'admin'}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
