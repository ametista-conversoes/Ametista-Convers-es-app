import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CHART_AXIS_COLOR, CHART_COLORS, CHART_GRID_COLOR, CHART_SURFACE_COLOR } from '@/lib/chart-colors'
import { formatDate } from '@/lib/format'
import type { MetricSeriesPoint } from '@/lib/metrics'

interface MetricDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  currentValue: number | null
  series: MetricSeriesPoint[]
  formatValue: (value: number | null) => string
}

/** Fase 22 — detalhe de uma métrica ao clicar no card: valor atual
 * (o mesmo já mostrado no card, não recalculado aqui, pra nunca
 * destoar), média de todo o histórico diário disponível, e o gráfico
 * de linha desse histórico dia a dia. */
export function MetricDetailDialog({ open, onOpenChange, label, currentValue, series, formatValue }: MetricDetailDialogProps) {
  const values = series.map((p) => p.value).filter((v): v is number => v != null)
  const average = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-secondary/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Valor atual</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{formatValue(currentValue)}</p>
          </div>
          <div className="rounded-lg bg-secondary/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Média do período</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{formatValue(average)}</p>
          </div>
        </div>

        {series.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há histórico diário registrado.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280} debounce={50}>
            <LineChart data={series}>
              <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
              <XAxis
                dataKey="date"
                stroke={CHART_AXIS_COLOR}
                tickLine={false}
                axisLine={{ stroke: CHART_GRID_COLOR }}
                fontSize={12}
                tickFormatter={(value: string) => formatDate(value)}
              />
              <YAxis stroke={CHART_AXIS_COLOR} tickLine={false} axisLine={false} fontSize={12} width={70} />
              <Tooltip
                contentStyle={{ background: CHART_SURFACE_COLOR, border: '1px solid #1A2540', borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: '#fff' }}
                labelFormatter={(value) => formatDate(String(value))}
                formatter={(value) => formatValue(Number(value))}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={label}
                stroke={CHART_COLORS.investimento}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS.investimento, stroke: CHART_SURFACE_COLOR, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </DialogContent>
    </Dialog>
  )
}
