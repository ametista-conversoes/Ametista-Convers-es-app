import { useState } from 'react'
import { Search } from 'lucide-react'
import { CatalogAddForm } from '@/components/catalog/CatalogAddForm'
import { CatalogEntryRow } from '@/components/catalog/CatalogEntryRow'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useAllCampaignLinksWithProject,
  useAllCatalogEntries,
  useAllClients,
  useDeleteCatalogEntry,
  useUpdateCatalogEntry,
  type CatalogEntryWithClient,
  type CatalogType,
} from '@/hooks/useManagerPortalData'
import { truncateCatalogText } from '@/lib/catalog'
import { catalogEntryPrioridadeRank } from '@/lib/status-styles'

const ALL_CLIENTS = 'all'

function sortEntries(entries: CatalogEntryWithClient[]) {
  return [...entries].sort((a, b) => {
    const aDiscarded = a.status === 'descartado'
    const bDiscarded = b.status === 'descartado'
    if (aDiscarded !== bDiscarded) return aDiscarded ? 1 : -1
    const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0)
    if (ratingDiff !== 0) return ratingDiff
    const prioDiff = catalogEntryPrioridadeRank[b.prioridade] - catalogEntryPrioridadeRank[a.prioridade]
    if (prioDiff !== 0) return prioDiff
    return b.created_at.localeCompare(a.created_at)
  })
}

/** Fase 34b/34c — página global "Catálogo" (Portal Gestor): vê, cria,
 * avalia, busca e apaga criativos/segmentações de TODOS os clientes
 * num só lugar (ou filtrado por um cliente específico) — diferente do
 * `CatalogCard` na Central de Informações, que é sempre de um cliente
 * só. Criar aqui exige um cliente específico selecionado no filtro
 * (não dá pra criar uma entrada sem dono quando "Todos os clientes"
 * está selecionado). Apagar usa o mesmo padrão "modo de exclusão" do
 * resto do app (Kanban, Clientes, etc.), não o ícone direto do
 * CatalogCard. */
export default function Catalog() {
  const { data: clients } = useAllClients()
  const criativosQuery = useAllCatalogEntries('criativo')
  const segmentacoesQuery = useAllCatalogEntries('segmentacao')
  const allLinksQuery = useAllCampaignLinksWithProject()
  const updateEntry = useUpdateCatalogEntry()
  const deleteEntry = useDeleteCatalogEntry()

  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)
  const [activeTab, setActiveTab] = useState<CatalogType>('criativo')
  const [deleteMode, setDeleteMode] = useState(false)
  const [search, setSearch] = useState('')

  const term = search.trim().toLowerCase()

  function renderList(catalogType: CatalogType, rawEntries: CatalogEntryWithClient[], isLoading: boolean, emptyText: string) {
    const filtered = rawEntries
      .filter((e) => clientFilter === ALL_CLIENTS || e.client_id === clientFilter)
      .filter((e) => !term || e.conteudo.toLowerCase().includes(term))
    const sorted = sortEntries(filtered)

    if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>
    if (sorted.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>

    return (
      <div className="space-y-2">
        {sorted.map((entry) => {
          const parent = entry.derivado_de ? rawEntries.find((e) => e.id === entry.derivado_de) : null
          const testLinkOptions = (allLinksQuery.data ?? []).filter(
            (link) => link.client_id === entry.client_id && link.project_test_type !== 'nenhum',
          )
          return (
            <CatalogEntryRow
              key={entry.id}
              entry={entry}
              catalogType={catalogType}
              clientName={entry.client?.name}
              parentLabel={parent ? truncateCatalogText(parent.conteudo, 50) : null}
              testLinkOptions={testLinkOptions}
              deleteMode={deleteMode}
              onUpdate={(patch) =>
                updateEntry.mutate({ id: entry.id, client_id: entry.client_id, catalog_type: entry.catalog_type, ...patch })
              }
              onDelete={() =>
                deleteEntry.mutateAsync({ id: entry.id, client_id: entry.client_id, catalog_type: entry.catalog_type })
              }
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Portal Gestor</p>
            <h1 className="text-2xl font-semibold text-foreground">Catálogo</h1>
          </div>
          <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por texto..."
              className="w-56 pl-9"
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
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CatalogType)}>
        <TabsList>
          <TabsTrigger value="criativo">Criativos</TabsTrigger>
          <TabsTrigger value="segmentacao">Segmentações</TabsTrigger>
        </TabsList>
        <TabsContent value="criativo" className="mt-4 space-y-3">
          {clientFilter === ALL_CLIENTS ? (
            <p className="text-xs text-muted-foreground">
              Selecione um cliente específico acima pra poder criar novos criativos.
            </p>
          ) : (
            <CatalogAddForm
              clientId={clientFilter}
              catalogType="criativo"
              entries={(criativosQuery.data ?? []).filter((e) => e.client_id === clientFilter)}
            />
          )}
          {renderList('criativo', criativosQuery.data ?? [], criativosQuery.isLoading, 'Nenhum criativo encontrado.')}
        </TabsContent>
        <TabsContent value="segmentacao" className="mt-4 space-y-3">
          {clientFilter === ALL_CLIENTS ? (
            <p className="text-xs text-muted-foreground">
              Selecione um cliente específico acima pra poder criar novas segmentações.
            </p>
          ) : (
            <CatalogAddForm
              clientId={clientFilter}
              catalogType="segmentacao"
              entries={(segmentacoesQuery.data ?? []).filter((e) => e.client_id === clientFilter)}
            />
          )}
          {renderList(
            'segmentacao',
            segmentacoesQuery.data ?? [],
            segmentacoesQuery.isLoading,
            'Nenhuma segmentação encontrada.',
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
