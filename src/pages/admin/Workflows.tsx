import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { WorkflowCard } from '@/components/workflows/WorkflowCard'
import { WorkflowTemplateFormDialog } from '@/components/workflows/WorkflowTemplateFormDialog'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWorkflowTemplates } from '@/hooks/useManagerPortalData'

export default function Workflows() {
  const { role } = useAuth()
  const { data: templates, isLoading } = useWorkflowTemplates()
  const [deleteMode, setDeleteMode] = useState(false)
  const [search, setSearch] = useState('')

  const term = search.trim().toLowerCase()
  const filteredTemplates = (templates ?? []).filter((template) => !term || template.name.toLowerCase().includes(term))

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar modelo..."
              className="w-56 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando modelos...</p>}
      {!isLoading && filteredTemplates.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum modelo de workflow encontrado.</p>
      )}

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {filteredTemplates.map((template) => (
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
