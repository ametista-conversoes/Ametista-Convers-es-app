import { useState } from 'react'
import { ListChecks, Trash2 } from 'lucide-react'
import { NewActivityChecklistItemDialog } from '@/components/onboarding/NewActivityChecklistItemDialog'
import { BulkDeleteToggle } from '@/components/shared/BulkDeleteToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ActivityChecklistItemRecord } from '@/hooks/useManagerPortalData'
import {
  useAllClients,
  useActivityChecklistItems,
  useDeleteActivityChecklistItems,
  useToggleActivityChecklistItem,
} from '@/hooks/useManagerPortalData'
import { useMarkNavSeen } from '@/hooks/useNavSeen'
import { cn } from '@/lib/utils'

const ALL_CLIENTS = 'all'
const AVULSAS_LABEL = 'Avulsas'

export default function Activities() {
  useMarkNavSeen('/activities')
  const { data: clients } = useAllClients()
  const { data: items, isLoading } = useActivityChecklistItems()
  const toggleItem = useToggleActivityChecklistItem()
  const deleteItems = useDeleteActivityChecklistItems()
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  function toggleSelected(itemId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  async function handleConfirmDelete() {
    await deleteItems.mutateAsync(Array.from(selectedIds))
    exitSelectMode()
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
          <BulkDeleteToggle
            active={selectMode}
            selectedCount={selectedIds.size}
            isDeleting={deleteItems.isPending}
            nounSingular="item"
            nounPlural="itens"
            selectedAdjective="selecionado"
            onActivate={() => setSelectMode(true)}
            onRequestExit={exitSelectMode}
            onConfirmDelete={handleConfirmDelete}
          />
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
                      {groupItems.map((item) => {
                        const selected = selectedIds.has(item.id)
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              'flex items-start gap-2 rounded-lg bg-secondary/50 px-3 py-2',
                              selectMode && selected && 'bg-red-500/10 ring-1 ring-red-500/60',
                            )}
                          >
                            <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                              <Checkbox
                                checked={item.completed}
                                disabled={toggleItem.isPending}
                                onCheckedChange={(checked) =>
                                  toggleItem.mutate({ itemId: item.id, completed: checked === true })
                                }
                              />
                              <div className="min-w-0">
                                <p
                                  className={`break-words text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                                >
                                  {item.title}
                                </p>
                                {item.category && <p className="text-xs text-muted-foreground">{item.category}</p>}
                              </div>
                            </label>
                            {selectMode && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  'h-8 w-8 shrink-0',
                                  selected ? 'text-red-500' : 'text-muted-foreground hover:text-destructive',
                                )}
                                aria-label={selected ? `Remover "${item.title}" da seleção` : `Selecionar "${item.title}" para apagar`}
                                aria-pressed={selected}
                                onClick={() => toggleSelected(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
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
