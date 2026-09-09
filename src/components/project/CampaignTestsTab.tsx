import { useState } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { Check, Plus, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  useAddCampaignAdChangeLogEntry,
  useCampaignAdChangeLog,
  useCampaignInsights,
  useCampaignVariantPerformances,
  useRemoveCampaignAdChangeLogEntry,
  useUpdateProject,
  type CampaignPerformance,
  type DigitalAssetConnectionRecord,
  type ProjectCampaignLink,
} from '@/hooks/useManagerPortalData'
import { formatCurrency, formatDate, formatPercent } from '@/lib/format'
import { ageRangeLabels, campaignTypeLabels, deviceLabels, genderLabels } from '@/lib/status-styles'
import { cn } from '@/lib/utils'

type TestType = 'segmentacao' | 'anuncio' | 'campanha'

interface CampaignTestsTabProps {
  projectId: string
  testType: TestType
  testMinSpend: number | null
  links: ProjectCampaignLink[]
  connections: DigitalAssetConnectionRecord[]
}

const TEST_TYPE_LABELS: Record<TestType, string> = {
  segmentacao: 'segmentação',
  anuncio: 'anúncio',
  campanha: 'campanha',
}

/** Aba "Testes" (Fase 33 — Teste A/B de Campanhas, spec em
 * docs/interno/"testes ab caampanhaa.md") — só aparece quando
 * `project.test_type !== 'nenhum'`. Trata cada campanha vinculada como
 * uma variante, comparando CPA/CTR/Taxa de Conversão entre elas
 * (`campaign_performance_snapshots` já existente, sem sincronização
 * nova) — variante com gasto abaixo do mínimo configurável entra na
 * lista mas fica marcada "dados insuficientes" e some do cálculo da
 * média do grupo. */
export function CampaignTestsTab({ projectId, testType, testMinSpend, links, connections }: CampaignTestsTabProps) {
  const updateProject = useUpdateProject()
  const [editingThreshold, setEditingThreshold] = useState(false)
  const [thresholdDraft, setThresholdDraft] = useState('')
  const variantPerformances = useCampaignVariantPerformances(links)

  if (links.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Vincule pelo menos 2 campanhas na aba Campanha pra comparar como variantes do teste de{' '}
        {TEST_TYPE_LABELS[testType]}.
      </p>
    )
  }

  async function handleSaveThreshold() {
    const parsed = thresholdDraft.trim() === '' ? null : Number(thresholdDraft.replace(',', '.'))
    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) return
    try {
      await updateProject.mutateAsync({ id: projectId, test_min_spend: parsed })
      setEditingThreshold(false)
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  const variants = links.map((link, i) => {
    const performance = variantPerformances[i]?.data ?? null
    const spend = performance?.spend ?? 0
    const eligible = testMinSpend == null || spend >= testMinSpend
    return { link, performance, eligible }
  })

  const eligibleWithData = variants.filter((v) => v.eligible && v.performance)
  const average = (values: Array<number | null | undefined>) => {
    const known = values.filter((v): v is number => v != null)
    return known.length > 0 ? known.reduce((sum, v) => sum + v, 0) / known.length : null
  }
  const avgCpa = average(eligibleWithData.map((v) => v.performance?.cpa))
  const avgCtr = average(eligibleWithData.map((v) => v.performance?.ctr))
  const avgConversionRate = average(eligibleWithData.map((v) => v.performance?.conversionRate))
  const enoughForComparison = eligibleWithData.length >= 2

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-secondary/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-foreground">Gasto mínimo pra entrar na comparação</p>
          {editingThreshold ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.01"
                autoFocus
                placeholder="Ex: 100"
                value={thresholdDraft}
                onChange={(e) => setThresholdDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveThreshold()}
                className="h-8 w-32 text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                disabled={updateProject.isPending}
                onClick={handleSaveThreshold}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                disabled={updateProject.isPending}
                onClick={() => setEditingThreshold(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="text-sm text-foreground underline decoration-dotted hover:text-purple-400"
              onClick={() => {
                setThresholdDraft(testMinSpend != null ? String(testMinSpend) : '')
                setEditingThreshold(true)
              }}
            >
              {testMinSpend != null ? formatCurrency(testMinSpend) : 'sem mínimo configurado — editar'}
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          Sugestão: entre R$100 e R$1.000, dependendo do cliente — não é travado no código. Variante com gasto
          abaixo do mínimo entra na lista, mas fica marcada "dados insuficientes" e não conta na média do grupo.
        </p>
      </div>

      <div className="space-y-3">
        {variants.map(({ link, performance, eligible }) => (
          <VariantCard
            key={link.id}
            link={link}
            performance={performance}
            eligible={eligible}
            enoughForComparison={enoughForComparison}
            avgCpa={avgCpa}
            avgCtr={avgCtr}
            avgConversionRate={avgConversionRate}
            testType={testType}
            provider={connections.find((c) => c.id === link.connection_id)?.provider ?? null}
          />
        ))}
      </div>
    </div>
  )
}

function VariantCard({
  link,
  performance,
  eligible,
  enoughForComparison,
  avgCpa,
  avgCtr,
  avgConversionRate,
  testType,
  provider,
}: {
  link: ProjectCampaignLink
  performance: CampaignPerformance | null
  eligible: boolean
  enoughForComparison: boolean
  avgCpa: number | null
  avgCtr: number | null
  avgConversionRate: number | null
  testType: TestType
  provider: string | null
}) {
  const daysActive = differenceInCalendarDays(new Date(), new Date(link.created_at))
  const campaignType = performance?.campaignTypes?.[0] ?? null

  const beatsAverage = (value: number | null | undefined, avg: number | null, lowerIsBetter: boolean) => {
    if (!eligible || !enoughForComparison || value == null || avg == null) return null
    return lowerIsBetter ? value < avg : value > avg
  }

  const cpaBeats = beatsAverage(performance?.cpa, avgCpa, true)
  const ctrBeats = beatsAverage(performance?.ctr, avgCtr, false)
  const conversionRateBeats = beatsAverage(performance?.conversionRate, avgConversionRate, false)

  return (
    <div className="space-y-3 rounded-lg border border-[#1A2540] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{link.external_campaign_name ?? link.external_campaign_id}</p>
          <p className="text-xs text-muted-foreground">
            ID: {link.external_campaign_id} · vinculada há{' '}
            {daysActive <= 0 ? 'hoje' : `${daysActive} dia${daysActive === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {campaignType && (
            <Badge className="border-[#1A2540] bg-secondary/50 text-muted-foreground">
              {campaignTypeLabels[campaignType] ?? campaignType}
            </Badge>
          )}
          {!eligible && <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-400">Dados insuficientes</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Gasto</p>
          <p className="text-foreground">{formatCurrency(performance?.spend ?? null)}</p>
        </div>
        <MetricTile label="CPA" value={formatCurrency(performance?.cpa ?? null)} beats={cpaBeats} />
        <MetricTile label="CTR" value={formatPercent(performance?.ctr ?? null)} beats={ctrBeats} />
        <MetricTile
          label="Taxa de Conversão"
          value={formatPercent(performance?.conversionRate ?? null)}
          beats={conversionRateBeats}
        />
      </div>

      {testType === 'segmentacao' && <VariantSegmentationSummary link={link} provider={provider} />}
      {testType === 'anuncio' && <VariantAdChangeLog campaignLinkId={link.id} />}
    </div>
  )
}

function MetricTile({ label, value, beats }: { label: string; value: string; beats: boolean | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('flex items-center gap-1', beats === true && 'text-emerald-400')}>
        {value}
        {beats === true && <TrendingUp className="h-3 w-3" />}
        {beats === false && <TrendingDown className="h-3 w-3 text-muted-foreground/50" />}
      </p>
    </div>
  )
}

/** Modo "segmentação" — reaproveita `useCampaignInsights` (dispositivo/
 * geográfico/demográfico), já buscado ao vivo pela aba Grupos de
 * Anúncios, pra mostrar o destaque de audiência de cada variante lado
 * a lado. Sem detalhamento demográfico extra além do que a API já
 * devolve. */
function VariantSegmentationSummary({ link, provider }: { link: ProjectCampaignLink; provider: string | null }) {
  const isGoogleAds = provider === 'google_ads'
  const insightsQuery = useCampaignInsights(isGoogleAds ? link.connection_id : null, isGoogleAds ? link.external_campaign_id : null)

  if (!isGoogleAds) {
    return (
      <p className="text-xs text-muted-foreground">
        Segmentação detalhada só disponível pra campanhas do Google Ads por enquanto.
      </p>
    )
  }

  if (insightsQuery.isLoading) return <p className="text-xs text-muted-foreground">Buscando segmentação...</p>

  const data = insightsQuery.data
  const topDevice = data?.devices[0]
  const topGeo = data?.geoBreakdown[0]
  const topAge = data?.ageRanges[0]
  const topGender = data?.genders[0]

  return (
    <div className="rounded-lg bg-secondary/30 p-2.5">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Segmentação (últimos 30 dias)</p>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground/70">Dispositivo top</p>
          <p className="text-foreground">{topDevice ? deviceLabels[topDevice.device] ?? topDevice.device : '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground/70">Local top</p>
          <p className="text-foreground">{topGeo?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground/70">Faixa etária top</p>
          <p className="text-foreground">{topAge ? ageRangeLabels[topAge.range] ?? topAge.range : '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground/70">Gênero top</p>
          <p className="text-foreground">{topGender ? genderLabels[topGender.gender] ?? topGender.gender : '—'}</p>
        </div>
      </div>
    </div>
  )
}

/** Modo "anúncio" — log manual (não sincronizado) de quando o criativo
 * foi trocado, por campanha vinculada. */
function VariantAdChangeLog({ campaignLinkId }: { campaignLinkId: string }) {
  const [adding, setAdding] = useState(false)
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const logQuery = useCampaignAdChangeLog(campaignLinkId)
  const addEntry = useAddCampaignAdChangeLogEntry()
  const removeEntry = useRemoveCampaignAdChangeLogEntry()

  async function handleAdd() {
    if (!description.trim()) return
    try {
      await addEntry.mutateAsync({
        campaign_link_id: campaignLinkId,
        changed_at: date || new Date().toISOString().slice(0, 10),
        description: description.trim(),
      })
      setDescription('')
      setDate('')
      setAdding(false)
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  return (
    <div className="rounded-lg bg-secondary/30 p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Log de troca de anúncio</p>
        {!adding && (
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setAdding(true)}>
            <Plus className="h-3 w-3" />
            Registrar
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-2 space-y-2">
          <DatePicker value={date} onChange={setDate} placeholder="Data da troca" />
          <Textarea
            placeholder='Ex: "troquei pra anúncio com CTA X"'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={addEntry.isPending || !description.trim()} onClick={handleAdd}>
              Salvar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false)
                setDescription('')
                setDate('')
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {logQuery.data && logQuery.data.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground">Nenhuma troca registrada ainda.</p>
      )}
      {logQuery.data && logQuery.data.length > 0 && (
        <div className="space-y-1">
          {logQuery.data.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-2 text-xs">
              <p className="text-foreground">
                <span className="text-muted-foreground">{formatDate(entry.changed_at)} — </span>
                {entry.description}
              </p>
              <button
                type="button"
                className="shrink-0 text-muted-foreground/50 hover:text-destructive"
                onClick={() => removeEntry.mutate({ id: entry.id, campaign_link_id: campaignLinkId })}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
