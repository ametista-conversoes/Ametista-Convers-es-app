import { useState } from 'react'
import { Image, Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { CatalogEntryRow } from '@/components/catalog/CatalogEntryRow'
import {
  useAllCampaignLinksWithProject,
  useCatalogEntries,
  useCreateCatalogEntry,
  useDeleteCatalogEntry,
  useUpdateCatalogEntry,
  type CatalogEntryOrigem,
  type CatalogEntryPrioridade,
  type CatalogEntryRecord,
  type CatalogEntryTipo,
  type CatalogType,
} from '@/hooks/useManagerPortalData'
import {
  CATALOG_NONE_VALUE,
  CATALOG_PRIORIDADE_OPTIONS,
  CATALOG_TIPO_OPTIONS,
  CATALOG_TIPO_PLACEHOLDERS,
  truncateCatalogText,
} from '@/lib/catalog'
import { catalogEntryPrioridadeLabels, catalogEntryPrioridadeRank, catalogEntryTipoLabels } from '@/lib/status-styles'

const CATALOG_META: Record<CatalogType, { title: string; icon: typeof Image; placeholder: string; empty: string }> = {
  criativo: {
    title: 'Catálogo de Criativos',
    icon: Image,
    placeholder: CATALOG_TIPO_PLACEHOLDERS.headline,
    empty: 'Nenhum criativo cadastrado ainda.',
  },
  segmentacao: {
    title: 'Catálogo de Segmentações',
    icon: Target,
    placeholder: 'Descreva a segmentação (interesses, público personalizado, lookalike 1%...)',
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
  const createEntry = useCreateCatalogEntry()
  const updateEntry = useUpdateCatalogEntry()
  const deleteEntry = useDeleteCatalogEntry()

  const [adding, setAdding] = useState(false)
  const [tipo, setTipo] = useState<CatalogEntryTipo>('headline')
  const [conteudo, setConteudo] = useState('')
  const [origem, setOrigem] = useState<CatalogEntryOrigem>('manual')
  const [prioridade, setPrioridade] = useState<CatalogEntryPrioridade>('media')
  const [derivadoDe, setDerivadoDe] = useState(CATALOG_NONE_VALUE)
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

  async function handleAdd() {
    if (!conteudo.trim()) return
    try {
      await createEntry.mutateAsync({
        client_id: clientId,
        catalog_type: catalogType,
        tipo: catalogType === 'criativo' ? tipo : null,
        conteudo: conteudo.trim(),
        origem,
        prioridade,
        derivado_de: derivadoDe === CATALOG_NONE_VALUE ? null : derivadoDe,
      })
      setConteudo('')
      setTipo('headline')
      setOrigem('manual')
      setPrioridade('media')
      setDerivadoDe(CATALOG_NONE_VALUE)
      setAdding(false)
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2 p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-purple-400" />
          {meta.title}
        </CardTitle>
        {!adding && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 p-0 pt-4">
        {adding && (
          <div className="space-y-2 rounded-lg bg-secondary/50 p-3">
            {catalogType === 'criativo' && (
              <Select value={tipo} onValueChange={(value) => setTipo(value as CatalogEntryTipo)}>
                <SelectTrigger className="h-8 w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATALOG_TIPO_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {catalogEntryTipoLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Textarea
              placeholder={catalogType === 'criativo' ? CATALOG_TIPO_PLACEHOLDERS[tipo] : meta.placeholder}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Select value={origem} onValueChange={(value) => setOrigem(value as CatalogEntryOrigem)}>
                <SelectTrigger className="h-8 w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ia">IA (Cassie)</SelectItem>
                  <SelectItem value="forms">Forms</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={prioridade} onValueChange={(value) => setPrioridade(value as CatalogEntryPrioridade)}>
                <SelectTrigger className="h-8 w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATALOG_PRIORIDADE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {catalogEntryPrioridadeLabels[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {entries.length > 0 && (
                <Select value={derivadoDe} onValueChange={setDerivadoDe}>
                  <SelectTrigger className="h-8 w-full sm:w-56">
                    <SelectValue placeholder="Variação de (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CATALOG_NONE_VALUE}>Não é variação de nada</SelectItem>
                    {entries.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {truncateCatalogText(e.conteudo, 40)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" disabled={createEntry.isPending || !conteudo.trim()} onClick={handleAdd}>
                Salvar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false)
                  setConteudo('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

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
