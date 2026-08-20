import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_AXIS_COLOR, CHART_COLORS, CHART_GRID_COLOR, CHART_SURFACE_COLOR } from '@/lib/chart-colors'
import { formatPercent } from '@/lib/format'

export interface OptionBreakdown {
  label: string
  count: number
  percentage: number
}

interface OptionBreakdownBarChartProps {
  data: OptionBreakdown[]
}

const MAX_LABEL_LENGTH = 42

function truncateLabel(label: string): string {
  return label.length > MAX_LABEL_LENGTH ? `${label.slice(0, MAX_LABEL_LENGTH - 1)}…` : label
}

/** Barras horizontais pra síntese em % de uma pergunta fechada de
 * formulário (Fase 8.3, Públicos-Alvo) — rótulos das opções são frases
 * inteiras, por isso barra horizontal em vez do vertical já usado em
 * `SpendRevenueBarChart`. Altura dinâmica: quem chama calcula conforme
 * `data.length`, já que uma pergunta pode ter de 2 a mais de 10 opções. */
export function OptionBreakdownBarChart({ data }: OptionBreakdownBarChartProps) {
  const height = Math.max(120, data.length * 40)

  return (
    <ResponsiveContainer width="100%" height={height} debounce={50}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid stroke={CHART_GRID_COLOR} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, (max: number) => Math.max(100, Math.ceil(max / 10) * 10)]}
          stroke={CHART_AXIS_COLOR}
          tickLine={false}
          axisLine={{ stroke: CHART_GRID_COLOR }}
          fontSize={12}
          tickFormatter={(value: number) => `${value}%`}
        />
        <YAxis
          type="category"
          dataKey="label"
          stroke={CHART_AXIS_COLOR}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={220}
          tickFormatter={truncateLabel}
        />
        <Tooltip
          cursor={{ fill: CHART_GRID_COLOR, opacity: 0.4 }}
          contentStyle={{ background: CHART_SURFACE_COLOR, border: '1px solid #1A2540', borderRadius: 8, fontSize: 13 }}
          labelStyle={{ color: '#fff' }}
          formatter={(value, _name, item) => {
            const count = (item.payload as OptionBreakdown).count
            return [`${formatPercent(Number(value))} (${count} resposta${count === 1 ? '' : 's'})`, 'Respondentes']
          }}
        />
        <Bar dataKey="percentage" name="Respondentes" fill={CHART_COLORS.respostas} radius={[0, 4, 4, 0]} maxBarSize={24}>
          <LabelList dataKey="percentage" position="right" formatter={(value: unknown) => formatPercent(Number(value))} fill={CHART_AXIS_COLOR} fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
