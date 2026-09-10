import { useState } from 'react'
import { Image, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CatalogAddForm } from '@/components/catalog/CatalogAddForm'
import { CatalogEntryRow } from '@/components/catalog/CatalogEntryRow'
import {
  useAllCampaignLinksWithProject,
  useCatalogEntries,
  useDeleteCatalogEntry,
  useUpdateCatalogEntry,
  type CatalogEntryRecord,
  type CatalogType,
} from '@/hooks/useManagerPortalData'
import { truncateCatalogText } from '@/lib/catalog'
import { catalogEntryPrioridadeRank } from '@/lib/status-styles'

const CATALOG_META: Record<CatalogType, { title: string; icon: typeof Image; empty: string }> = {
  criativo: {
    title: 'Catálogo de Criativos',
    icon: Image,
    empty: 'Nenhum criativo cadastrado ainda.',
  },
  segmentacao: {
    title: 'Catálogo de Segmentações',
    icon: Target,
    empty: 'Nenhuma segmentação cadastrada ainda.',
  },
}

interface CatalogCardProps {
  clientId: string
  catalogType: CatalogType
}

/** Fase 34 — Catálogo de Criativos e Segmentações: organização e
 * classificação de anúncios (texto/vídeo) e segmentações, sempre por
 * cliente específico, sem reaproveitamento entre clientes. Duas abas
 * (Em Triagem / Confirmados-Implementados) em vez de uma lista única —
 * "Em Triagem" ordenada por prioridade, é onde se decide o que
 * testar/implementar em seguida. Visão de TODOS os clientes juntos fica
 * na página global "Catálogo" (`src/pages/admin/Catalog.tsx`). */
export function CatalogCard({ clientId, catalogType }: CatalogCardProps) {
  const meta = CATALOG_META[catalogType]
  const Icon = meta.icon
  const entriesQuery = useCatalogEntries(clientId, catalogType)
  const allLinksQuery = useAllCampaignLinksWithProject()
  const updateEntry = useUpdateCatalogEntry()
  const deleteEntry = useDeleteCatalogEntry()

  const [showDiscarded, setShowDiscarded] = useState(false)

  const entries = entriesQuery.data ?? []
  const triagem = entries
    .filter((e) => e.status === 'rascunho' || e.status === 'em_teste')
    .sort((a, b) => catalogEntryPrioridadeRank[b.prioridade] - catalogEntryPrioridadeRank[a.prioridade])
  const confirmed = entries.filter((e) => e.status === 'aprovado_implementado')
  const discarded = entries.filter((e) => e.status === 'descartado')

  const testLinkOptions = (allLinksQuery.data ?? []).filter(
    (link) => link.client_id === clientId && link.project_test_type !== 'nenhum',
  )

  function findParentLabel(entry: CatalogEntryRecord) {
    if (!entry.derivado_de) return null
    const parent = entries.find((e) => e.id === entry.derivado_de)
    return parent ? truncateCatalogText(parent.conteudo, 50) : null
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-purple-400" />
          {meta.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0 pt-4">
        <CatalogAddForm clientId={clientId} catalogType={catalogType} entries={entries} />

        <Tabs defaultValue="triagem">
          <TabsList>
            <TabsTrigger value="triagem">Em Triagem ({triagem.length})</TabsTrigger>
            <TabsTrigger value="confirmados">Confirmados/Implementados ({confirmed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="triagem" className="mt-3 space-y-2">
            {triagem.length === 0 && <p className="text-sm text-muted-foreground">Nada em triagem no momento.</p>}
            {triagem.map((entry) => (
              <CatalogEntryRow
                key={entry.id}
                entry={entry}
                catalogType={catalogType}
                parentLabel={findParentLabel(entry)}
                testLinkOptions={testLinkOptions}
                onUpdate={(patch) =>
                  updateEntry.mutate({ id: entry.id, client_id: clientId, catalog_type: catalogType, ...patch })
                }
                onDelete={() => deleteEntry.mutate({ id: entry.id, client_id: clientId, catalog_type: catalogType })}
              />
            ))}
          </TabsContent>
          <TabsContent value="confirmados" className="mt-3 space-y-2">
            {confirmed.length === 0 && <p className="text-sm text-muted-foreground">{meta.empty}</p>}
            {confirmed.map((entry) => (
              <CatalogEntryRow
                key={entry.id}
                entry={entry}
                catalogType={catalogType}
                parentLabel={findParentLabel(entry)}
                testLinkOptions={testLinkOptions}
                onUpdate={(patch) =>
                  updateEntry.mutate({ id: entry.id, client_id: clientId, catalog_type: catalogType, ...patch })
                }
                onDelete={() => deleteEntry.mutate({ id: entry.id, client_id: clientId, catalog_type: catalogType })}
              />
            ))}
          </TabsContent>
        </Tabs>

        {discarded.length > 0 && (
          <div>
            <button
              type="button"
              className="text-xs text-muted-foreground underline decoration-dotted hover:text-purple-400"
              onClick={() => setShowDiscarded((v) => !v)}
            >
              {showDiscarded ? 'Ocultar' : 'Mostrar'} descartados ({discarded.length})
            </button>
            {showDiscarded && (
              <div className="mt-2 space-y-2">
                {discarded.map((entry) => (
                  <CatalogEntryRow
                    key={entry.id}
                    entry={entry}
                    catalogType={catalogType}
                    parentLabel={findParentLabel(entry)}
                    testLinkOptions={testLinkOptions}
                    onUpdate={(patch) =>
                      updateEntry.mutate({ id: entry.id, client_id: clientId, catalog_type: catalogType, ...patch })
                    }
                    onDelete={() => deleteEntry.mutate({ id: entry.id, client_id: clientId, catalog_type: catalogType })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
