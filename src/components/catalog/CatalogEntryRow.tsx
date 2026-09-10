import { Star, TrendingDown, TrendingUp, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import {
  useCampaignLinkTestResult,
  type CatalogEntryPrioridade,
  type CatalogEntryRecord,
  type CatalogEntryStatus,
  type CatalogType,
} from '@/hooks/useManagerPortalData'
import { CATALOG_NONE_VALUE, CATALOG_PRIORIDADE_OPTIONS, CATALOG_STATUS_OPTIONS } from '@/lib/catalog'
import { formatCurrency, formatPercent } from '@/lib/format'
import {
  catalogEntryOrigemLabels,
  catalogEntryPrioridadeLabels,
  catalogEntryPrioridadeStyles,
  catalogEntryStatusLabels,
  catalogEntryStatusStyles,
  catalogEntryTipoLabels,
} from '@/lib/status-styles'
import { cn } from '@/lib/utils'

export interface TestLinkOption {
  id: string
  project_title: string
  external_campaign_name: string | null
  external_campaign_id: string
}

export interface CatalogEntryUpdatePatch {
  status?: CatalogEntryStatus
  prioridade?: CatalogEntryPrioridade
  campaign_link_id?: string | null
  rating?: number | null
}

interface CatalogEntryRowProps {
  entry: CatalogEntryRecord
  catalogType: CatalogType
  parentLabel: string | null
  testLinkOptions: TestLinkOption[]
  /** Só passado pela página global "Catálogo" (todos os clientes de uma
   * vez) — mostra de qual cliente é essa entrada. */
  clientName?: string
  /** Ausente (padrão, usado pelo CatalogCard por cliente) = ícone de
   * lixeira direto, sempre visível, apaga na hora (mesmo padrão do log
   * de troca de anúncio da Fase 33). Presente (usado pela página global
   * "Catálogo") = padrão "modo de exclusão" do resto do app
   * (`DeleteItemButton`, com confirmação) — só aparece quando `true`. */
  deleteMode?: boolean
  onUpdate: (patch: CatalogEntryUpdatePatch) => void
  onDelete: () => void | Promise<void>
}

export function CatalogEntryRow({
  entry,
  catalogType,
  parentLabel,
  testLinkOptions,
  clientName,
  deleteMode,
  onUpdate,
  onDelete,
}: CatalogEntryRowProps) {
  return (
    <div className="space-y-2 rounded-lg bg-secondary/50 px-3 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm text-foreground">{entry.conteudo}</p>
        {deleteMode === undefined ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ) : (
          deleteMode && (
            <DeleteItemButton
              label="essa entrada do catálogo"
              className="h-6 w-6 shrink-0"
              onDelete={async () => {
                await onDelete()
              }}
            />
          )
        )}
      </div>
      {parentLabel && <p className="text-xs text-muted-foreground/70">↳ variação de: {parentLabel}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        {clientName && (
          <Badge className="border-purple-600/20 bg-purple-600/10 text-purple-400">{clientName}</Badge>
        )}
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
            {CATALOG_PRIORIDADE_OPTIONS.map((p) => (
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
            {CATALOG_STATUS_OPTIONS.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => onUpdate({ status: s })}>
                {catalogEntryStatusLabels[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {catalogType === 'criativo' && (
          <StarRating value={entry.rating} onChange={(rating) => onUpdate({ rating })} />
        )}
      </div>
      {testLinkOptions.length > 0 && (
        <Select
          value={entry.campaign_link_id ?? CATALOG_NONE_VALUE}
          onValueChange={(value) => onUpdate({ campaign_link_id: value === CATALOG_NONE_VALUE ? null : value })}
        >
          <SelectTrigger className="h-7 w-full text-xs sm:w-64">
            <SelectValue placeholder="Vincular a Grupo de Teste (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CATALOG_NONE_VALUE}>Sem Grupo de Teste vinculado</SelectItem>
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

/** 1 a 5 estrelas — clicar na estrela já marcada desmarca (volta pra
 * "sem avaliação"). Só faz sentido pra Criativos (pedido do usuário),
 * mas o campo em si é genérico no banco. */
function StarRating({ value, onChange }: { value: number | null; onChange: (rating: number | null) => void }) {
  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Avaliar ${n} estrela${n === 1 ? '' : 's'}`}
          className="text-muted-foreground/40 hover:text-amber-400"
          onClick={() => onChange(value === n ? null : n)}
        >
          <Star className={cn('h-3.5 w-3.5', value != null && n <= value && 'fill-amber-400 text-amber-400')} />
        </button>
      ))}
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
