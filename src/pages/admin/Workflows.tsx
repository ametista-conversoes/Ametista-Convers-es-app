import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ActivityTemplateCard } from '@/components/workflows/ActivityTemplateCard'
import { ActivityTemplateFormDialog } from '@/components/workflows/ActivityTemplateFormDialog'
import { ClientWorkflowCard } from '@/components/workflows/ClientWorkflowCard'
import { ClientWorkflowTemplateFormDialog } from '@/components/workflows/ClientWorkflowTemplateFormDialog'
import { WorkflowCard } from '@/components/workflows/WorkflowCard'
import { WorkflowTemplateFormDialog } from '@/components/workflows/WorkflowTemplateFormDialog'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useActivityTemplates, useClientWorkflowTemplates, useWorkflowTemplates } from '@/hooks/useManagerPortalData'

export default function Workflows() {
  const { role } = useAuth()
  const { data: templates, isLoading } = useWorkflowTemplates()
  const { data: clientTemplates, isLoading: isLoadingClientTemplates } = useClientWorkflowTemplates()
  const { data: activityTemplates, isLoading: isLoadingActivityTemplates } = useActivityTemplates()
  const [deleteMode, setDeleteMode] = useState(false)
  const [search, setSearch] = useState('')

  const term = search.trim().toLowerCase()
  const filteredTemplates = (templates ?? []).filter((template) => !term || template.name.toLowerCase().includes(term))
  const filteredClientTemplates = (clientTemplates ?? []).filter(
    (template) => !term || template.name.toLowerCase().includes(term),
  )
  const filteredActivityTemplates = (activityTemplates ?? []).filter(
    (template) => !term || template.name.toLowerCase().includes(term),
  )

  // Pra cada Workflow de Atividades, quais Workflows Operacionais o
  // disparam — calculado aqui (não fica salvo em lugar nenhum) porque
  // o vínculo em si só existe do lado do Workflow Operacional
  // (activity_template_ids).
  const linkedWorkflowNamesByActivityId = new Map<string, string[]>()
  for (const workflowTemplate of templates ?? []) {
    for (const activityTemplateId of workflowTemplate.activity_template_ids) {
      const list = linkedWorkflowNamesByActivityId.get(activityTemplateId) ?? []
      list.push(workflowTemplate.name)
      linkedWorkflowNamesByActivityId.set(activityTemplateId, list)
    }
  }

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
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar modelo..."
            className="w-56 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="operational">
        <TabsList>
          <TabsTrigger value="operational">Operacional</TabsTrigger>
          <TabsTrigger value="client">Workflows do Cliente</TabsTrigger>
          <TabsTrigger value="activity">Workflows de Atividades</TabsTrigger>
        </TabsList>

        <TabsContent value="operational" className="space-y-4">
          {role === 'admin' && (
            <div className="flex justify-end">
              <WorkflowTemplateFormDialog
                trigger={
                  <Button>
                    <Plus className="h-4 w-4" />
                    Novo modelo
                  </Button>
                }
              />
            </div>
          )}

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
        </TabsContent>

        <TabsContent value="client" className="space-y-4">
          {role === 'admin' && (
            <div className="flex justify-end">
              <ClientWorkflowTemplateFormDialog
                trigger={
                  <Button>
                    <Plus className="h-4 w-4" />
                    Novo modelo
                  </Button>
                }
              />
            </div>
          )}

          {isLoadingClientTemplates && <p className="text-sm text-muted-foreground">Carregando modelos...</p>}
          {!isLoadingClientTemplates && filteredClientTemplates.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum modelo de workflow do cliente encontrado.</p>
          )}

          <div className="content-grid-container">
            <div className="content-grid gap-4">
              {filteredClientTemplates.map((template) => (
                <ClientWorkflowCard
                  key={template.id}
                  template={template}
                  deleteMode={role === 'admin' && deleteMode}
                  canEdit={role === 'admin'}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {role === 'admin' && (
            <div className="flex justify-end">
              <ActivityTemplateFormDialog
                trigger={
                  <Button>
                    <Plus className="h-4 w-4" />
                    Novo modelo
                  </Button>
                }
              />
            </div>
          )}

          {isLoadingActivityTemplates && <p className="text-sm text-muted-foreground">Carregando modelos...</p>}
          {!isLoadingActivityTemplates && filteredActivityTemplates.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum Workflow de Atividades encontrado.</p>
          )}

          <div className="content-grid-container">
            <div className="content-grid gap-4">
              {filteredActivityTemplates.map((template) => (
                <ActivityTemplateCard
                  key={template.id}
                  template={template}
                  deleteMode={role === 'admin' && deleteMode}
                  canEdit={role === 'admin'}
                  linkedWorkflowNames={linkedWorkflowNamesByActivityId.get(template.id) ?? []}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
