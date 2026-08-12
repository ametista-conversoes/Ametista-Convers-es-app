import { useState } from 'react'
import { CheckSquare, Plus, Search } from 'lucide-react'
import { KanbanTaskFormDialog } from '@/components/kanban/KanbanTaskFormDialog'
import { ManagerTaskRow } from '@/components/tasks/ManagerTaskRow'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllClients, useAllTasks } from '@/hooks/useManagerPortalData'

const ALL_CLIENTS = 'all'

export default function ManagerClientTasks() {
  const { data: clients } = useAllClients()
  const { data: tasks, isLoading } = useAllTasks()
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)
  const [deleteMode, setDeleteMode] = useState(false)
  const [search, setSearch] = useState('')

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const term = search.trim().toLowerCase()
  const filteredTasks = (tasks ?? [])
    .filter((task) => clientFilter === ALL_CLIENTS || task.client_id === clientFilter)
    .filter((task) => !term || task.title.toLowerCase().includes(term))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Portal Gestor</p>
            <h1 className="text-2xl font-semibold text-foreground">Tarefas do Cliente</h1>
          </div>
          <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefa..."
              className="w-48 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLIENTS}>Todos os clientes</SelectItem>
              {(clients ?? []).map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <KanbanTaskFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Nova tarefa
              </Button>
            }
          />
        </div>
      </div>

      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckSquare className="h-4 w-4 text-purple-400" />
            Tarefas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-0 pt-4">
          {filteredTasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada.</p>}
          {filteredTasks.map((task) => (
            <ManagerTaskRow key={task.id} task={task} showClientName={clientFilter === ALL_CLIENTS} deleteMode={deleteMode} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
