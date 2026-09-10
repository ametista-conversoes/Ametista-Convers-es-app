import { useState } from 'react'
import { Image, Plus, Target, TrendingDown, TrendingUp, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  useAllCampaignLinksWithProject,
  useCampaignLinkTestResult,
  useCatalogEntries,
  useCreateCatalogEntry,
  useDeleteCatalogEntry,
  useUpdateCatalogEntry,
  type CatalogEntryOrigem,
  type CatalogEntryPrioridade,
  type CatalogEntryRecord,
  type CatalogEntryStatus,
  type CatalogEntryTipo,
  type CatalogType,
} from '@/hooks/useManagerPortalData'
import { formatCurrency, formatPercent } from '@/lib/format'
import {
  catalogEntryOrigemLabels,
  catalogEntryPrioridadeLabels,
  catalogEntryPrioridadeRank,
  catalogEntryPrioridadeStyles,
  catalogEntryStatusLabels,
  catalogEntryStatusStyles,
  catalogEntryTipoLabels,
} from '@/lib/status-styles'
import { cn } from '@/lib/utils'

const NONE_VALUE = 'none'
const STATUS_OPTIONS: CatalogEntryStatus[] = ['rascunho', 'em_teste', 'aprovado_implementado', 'descartado']
const PRIORIDADE_OPTIONS: CatalogEntryPrioridade[] = ['alta', 'media', 'baixa']

function truncate(text: string, max = 70) {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

const CATALOG_META: Record<CatalogType, { title: string; icon: typeof Image; placeholder: string; empty: string }> = {
  criativo: {
    title: 'Catálogo de Criativos',
    icon: Image,
    placeholder: 'Texto do anúncio...',
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
 * testar/implementar em seguida. */
export function CatalogCard({ clientId, catalogType }: CatalogCardProps) {
  const meta = CATALOG_META[catalogType]
  const Icon = meta.icon
  const entriesQuery = useCatalogEntries(clientId, catalogType)
  const allLinksQuery = useAllCampaignLinksWithProject()
  const createEntry = useCreateCatalogEntry()
  const updateEntry = useUpdateCatalogEntry()
  const deleteEntry = useDeleteCatalogEntry()

  const [adding, setAdding] = useState(false)
  const [tipo, setTipo] = useState<CatalogEntryTipo>('texto')
  const [conteudo, setConteudo] = useState('')
  const [origem, setOrigem] = useState<CatalogEntryOrigem>('manual')
  const [prioridade, setPrioridade] = useState<CatalogEntryPrioridade>('media')
  const [derivadoDe, setDerivadoDe] = useState(NONE_VALUE)
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
    return parent ? truncate(parent.conteudo, 50) : null
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
        derivado_de: derivadoDe === NONE_VALUE ? null : derivadoDe,
      })
      setConteudo('')
      setTipo('texto')
      setOrigem('manual')
      setPrioridade('media')
      setDerivadoDe(NONE_VALUE)
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
                <SelectTrigger className="h-8 w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">Texto</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Textarea
              placeholder={
                catalogType === 'criativo' && tipo === 'video'
                  ? 'Caminho/nome do arquivo (ex: ClienteX/Videos/anuncio_v3_final.mp4)'
                  : meta.placeholder
              }
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Select value={origem} onValueChange={(value) => setOrigem(value as CatalogEntryOrigem)}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ia">IA (Cassie)</SelectItem>
                  <SelectItem value="forms">Forms</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={prioridade} onValueChange={(value) => setPrioridade(value as CatalogEntryPrioridade)}>
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      Prioridade {catalogEntryPrioridadeLabels[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {entries.length > 0 && (
                <Select value={derivadoDe} onValueChange={setDerivadoDe}>
                  <SelectTrigger className="h-8 w-56">
                    <SelectValue placeholder="Variação de (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Não é variação de nada</SelectItem>
                    {entries.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {truncate(e.conteudo, 40)}
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

interface TestLinkOption {
  id: string
  project_title: string
  external_campaign_name: string | null
  external_campaign_id: string
}

function CatalogEntryRow({
  entry,
  catalogType,
  parentLabel,
  testLinkOptions,
  onUpdate,
  onDelete,
}: {
  entry: CatalogEntryRecord
  catalogType: CatalogType
  parentLabel: string | null
  testLinkOptions: TestLinkOption[]
  onUpdate: (patch: { status?: CatalogEntryStatus; prioridade?: CatalogEntryPrioridade; campaign_link_id?: string | null }) => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-2 rounded-lg bg-secondary/50 px-3 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm text-foreground">{entry.conteudo}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {parentLabel && <p className="text-xs text-muted-foreground/70">↳ variação de: {parentLabel}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        {entry.tipo && catalogType === 'criativo' && (
          <Badge className="border-[#1A2540] bg-secondary text-muted-foreground">{catalogEntryTipoLabels[entry.tipo]}</Badge>
        )}
        <Badge className="border-[#1A2540] bg-secondary text-muted-foreground">{catalogEntryOrigemLabels[entry.origem]}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge className={cn('cursor-pointer', catalogEntryPrioridadeStyles[entry.prioridade])}>
              {catalogEntryPrioridadeLabels[entry.prioridade]}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {PRIORIDADE_OPTIONS.map((p) => (
              <DropdownMenuItem key={p} onSelect={() => onUpdate({ prioridade: p })}>
                {catalogEntryPrioridadeLabels[p]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge className={cn('cursor-pointer', catalogEntryStatusStyles[entry.status])}>
              {catalogEntryStatusLabels[entry.status]}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {STATUS_OPTIONS.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => onUpdate({ status: s })}>
                {catalogEntryStatusLabels[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {testLinkOptions.length > 0 && (
        <Select
          value={entry.campaign_link_id ?? NONE_VALUE}
          onValueChange={(value) => onUpdate({ campaign_link_id: value === NONE_VALUE ? null : value })}
        >
          <SelectTrigger className="h-7 w-full text-xs sm:w-64">
            <SelectValue placeholder="Vincular a Grupo de Teste (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>Sem Grupo de Teste vinculado</SelectItem>
            {testLinkOptions.map((link) => (
              <SelectItem key={link.id} value={link.id}>
                {link.project_title} — {link.external_campaign_name ?? link.external_campaign_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {entry.campaign_link_id && (entry.status === 'em_teste' || entry.status === 'aprovado_implementado') && (
        <CatalogEntryTestResult campaignLinkId={entry.campaign_link_id} />
      )}
    </div>
  )
}

/** "Herda o resultado (média, acima/abaixo da média) automaticamente"
 * — mesmo cálculo do Grupo de Teste (Fase 33), autocontido a partir só
 * do `campaign_link_id` vinculado à entrada do catálogo. */
function CatalogEntryTestResult({ campaignLinkId }: { campaignLinkId: string }) {
  const resultQuery = useCampaignLinkTestResult(campaignLinkId)
  const result = resultQuery.data

  if (resultQuery.isLoading) return <p className="text-xs text-muted-foreground">Buscando resultado do teste...</p>
  if (!result) return null

  if (!result.eligible) {
    return <p className="text-xs text-amber-400">Dados insuficientes (gasto abaixo do mínimo configurado no projeto)</p>
  }
  if (!result.hasEnoughVariants) {
    return <p className="text-xs text-muted-foreground">Aguardando outras variantes elegíveis pra comparar a média.</p>
  }

  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      <ResultTile label="CPA" value={formatCurrency(result.cpa)} beats={result.beatsCpa} />
      <ResultTile label="CTR" value={formatPercent(result.ctr)} beats={result.beatsCtr} />
      <ResultTile label="Tx. Conversão" value={formatPercent(result.conversionRate)} beats={result.beatsConversionRate} />
    </div>
  )
}

function ResultTile({ label, value, beats }: { label: string; value: string; beats: boolean | null }) {
  return (
    <div>
      <p className="text-muted-foreground/70">{label}</p>
      <p className={cn('flex items-center gap-1 text-foreground', beats === true && 'text-emerald-400')}>
        {value}
        {beats === true && <TrendingUp className="h-3 w-3" />}
        {beats === false && <TrendingDown className="h-3 w-3 text-muted-foreground/50" />}
      </p>
    </div>
  )
}
