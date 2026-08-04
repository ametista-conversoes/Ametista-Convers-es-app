import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_AXIS_COLOR, CHART_COLORS, CHART_GRID_COLOR, CHART_SURFACE_COLOR } from '@/lib/chart-colors'
import { formatCurrency, formatDate } from '@/lib/format'

export interface TrendPoint {
  date: string
  investimento: number
  receita: number
}

interface PerformanceTrendChartProps {
  data: TrendPoint[]
}

export function PerformanceTrendChart({ data }: PerformanceTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300} debounce={50}>
      <LineChart data={data}>
        <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="date"
          stroke={CHART_AXIS_COLOR}
          tickLine={false}
          axisLine={{ stroke: CHART_GRID_COLOR }}
          fontSize={12}
          tickFormatter={(value: string) => formatDate(value)}
        />
        <YAxis
          stroke={CHART_AXIS_COLOR}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={90}
          tickFormatter={(value: number) => formatCurrency(value)}
        />
        <Tooltip
          contentStyle={{ background: CHART_SURFACE_COLOR, border: '1px solid #1A2540', borderRadius: 8, fontSize: 13 }}
          labelStyle={{ color: '#fff' }}
          labelFormatter={(value) => formatDate(String(value))}
          formatter={(value) => formatCurrency(Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 13, color: CHART_AXIS_COLOR }} />
        <Line
          type="monotone"
          dataKey="investimento"
          name="Investimento"
          stroke={CHART_COLORS.investimento}
          strokeWidth={2}
          dot={{ r: 3, fill: CHART_COLORS.investimento, stroke: CHART_SURFACE_COLOR, strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="receita"
          name="Receita"
          stroke={CHART_COLORS.receita}
          strokeWidth={2}
          dot={{ r: 3, fill: CHART_COLORS.receita, stroke: CHART_SURFACE_COLOR, strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
