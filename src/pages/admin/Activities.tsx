import { useState } from 'react'
import { ListChecks } from 'lucide-react'
import { NewActivityChecklistItemDialog } from '@/components/onboarding/NewActivityChecklistItemDialog'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ActivityChecklistItemRecord } from '@/hooks/useManagerPortalData'
import {
  useAllClients,
  useActivityChecklistItems,
  useDeleteActivityChecklistItem,
  useToggleActivityChecklistItem,
} from '@/hooks/useManagerPortalData'
import { useMarkNavSeen } from '@/hooks/useNavSeen'

const ALL_CLIENTS = 'all'
const AVULSAS_LABEL = 'Avulsas'

export default function Activities() {
  useMarkNavSeen('/activities')
  const { data: clients } = useAllClients()
  const { data: items, isLoading } = useActivityChecklistItems()
  const toggleItem = useToggleActivityChecklistItem()
  const deleteItem = useDeleteActivityChecklistItem()
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)
  const [deleteMode, setDeleteMode] = useState(false)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const visibleClients = (clients ?? []).filter(
    (client) => clientFilter === ALL_CLIENTS || client.id === clientFilter,
  )
  const itemsByClient = new Map<string, ActivityChecklistItemRecord[]>()
  for (const item of items ?? []) {
    const list = itemsByClient.get(item.client_id) ?? []
    list.push(item)
    itemsByClient.set(item.client_id, list)
  }
  const clientsWithItems = visibleClients.filter((client) => (itemsByClient.get(client.id)?.length ?? 0) > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Portal Gestor</p>
            <h1 className="text-2xl font-semibold text-foreground">Atividades</h1>
          </div>
          <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          <NewActivityChecklistItemDialog />
        </div>
      </div>

      {clientsWithItems.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum item de Atividades cadastrado ainda.</p>
      )}

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {clientsWithItems.map((client) => {
            const clientItems = itemsByClient.get(client.id) ?? []
            const total = clientItems.length
            const done = clientItems.filter((item) => item.completed).length
            const percent = total > 0 ? Math.round((done / total) * 100) : 0

            const itemsByGroup = new Map<string, ActivityChecklistItemRecord[]>()
            for (const item of clientItems) {
              const group = item.source_template_name ?? AVULSAS_LABEL
              const list = itemsByGroup.get(group) ?? []
              list.push(item)
              itemsByGroup.set(group, list)
            }

            return (
              <Card
                key={client.id}
                className="flex flex-col rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6"
              >
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ListChecks className="h-4 w-4 text-purple-400" />
                    {client.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-0 pt-4">
                  <div>
                    <Progress value={percent} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {done} de {total} itens concluídos ({percent}%)
                    </p>
                  </div>
                  {Array.from(itemsByGroup.entries()).map(([groupName, groupItems]) => (
                    <div key={groupName} className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">{groupName}</p>
                      {groupItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                          <label className="flex flex-1 cursor-pointer items-center gap-3">
                            <Checkbox
                              checked={item.completed}
                              disabled={toggleItem.isPending}
                              onCheckedChange={(checked) =>
                                toggleItem.mutate({ itemId: item.id, completed: checked === true })
                              }
                            />
                            <div className="min-w-0">
                              <p
                                className={`truncate text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                              >
                                {item.title}
                              </p>
                              {item.category && <p className="text-xs text-muted-foreground">{item.category}</p>}
                            </div>
                          </label>
                          {deleteMode && (
                            <DeleteItemButton
                              label={`o item "${item.title}"`}
                              onDelete={() => deleteItem.mutateAsync(item.id)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
