import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMetricAlertThresholds, useUpsertMetricAlertThreshold } from '@/hooks/useManagerPortalData'

const METRICS: Array<{ key: string; label: string }> = [
  { key: 'cpa', label: 'CPA' },
  { key: 'roas', label: 'ROAS' },
  { key: 'ctr', label: 'CTR' },
  { key: 'spend', label: 'Investimento' },
  { key: 'revenue', label: 'Receita' },
]

interface RowState {
  enabled: boolean
  comparison: 'above' | 'below'
  thresholdValue: string
}

const DEFAULT_ROW: RowState = { enabled: false, comparison: 'above', thresholdValue: '' }

interface MetricAlertThresholdsCardProps {
  clientId: string
}

/** Fase 21.2 — alerta automático quando a média dos últimos 7 dias de
 * uma métrica do cliente passa do limite configurado aqui; a checagem
 * de verdade roda no banco (check_metric_alert_thresholds), chamada
 * pela Edge Function a cada sincronização de integrações. */
export function MetricAlertThresholdsCard({ clientId }: MetricAlertThresholdsCardProps) {
  const { data: thresholds, isLoading } = useMetricAlertThresholds(clientId)
  const upsert = useUpsertMetricAlertThreshold()
  const [edits, setEdits] = useState<Record<string, RowState | undefined>>({})
  const [saving, setSaving] = useState(false)

  function rowFor(metric: string): RowState {
    if (edits[metric]) return edits[metric] as RowState
    const saved = (thresholds ?? []).find((t) => t.metric === metric)
    if (!saved) return DEFAULT_ROW
    return { enabled: saved.enabled, comparison: saved.comparison, thresholdValue: String(saved.threshold_value) }
  }

  function updateRow(metric: string, patch: Partial<RowState>) {
    setEdits((prev) => ({ ...prev, [metric]: { ...rowFor(metric), ...patch } }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await Promise.all(
        METRICS.filter(({ key }) => rowFor(key).thresholdValue.trim()).map(({ key }) => {
          const row = rowFor(key)
          return upsert.mutateAsync({
            client_id: clientId,
            metric: key,
            comparison: row.comparison,
            threshold_value: Number(row.thresholdValue),
            enabled: row.enabled,
          })
        }),
      )
      setEdits({})
      toast.success('Alertas de limiar atualizados.')
    } catch {
      // erro já avisado pelo onError do hook
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-purple-400" />
          Alertas por Limiar de Métrica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        <p className="text-xs text-muted-foreground">
          Cria um alerta automático quando a média dos últimos 7 dias de uma métrica passa do limite — checado a cada
          sincronização de integrações.
        </p>
        {METRICS.map(({ key, label }) => {
          const row = rowFor(key)
          return (
            <div key={key} className="flex flex-wrap items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2">
              <Checkbox checked={row.enabled} onCheckedChange={(checked) => updateRow(key, { enabled: checked === true })} />
              <span className="w-28 shrink-0 text-sm text-foreground">{label}</span>
              <Select value={row.comparison} onValueChange={(value) => updateRow(key, { comparison: value as 'above' | 'below' })}>
                <SelectTrigger className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Acima de</SelectItem>
                  <SelectItem value="below">Abaixo de</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                placeholder="Valor"
                value={row.thresholdValue}
                onChange={(e) => updateRow(key, { thresholdValue: e.target.value })}
                className="h-8 w-28"
              />
            </div>
          )
        })}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alertas'}
        </Button>
      </CardContent>
    </Card>
  )
}
