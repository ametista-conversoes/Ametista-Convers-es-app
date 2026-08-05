import { Gauge } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProductivityGaugeProps {
  value: number | null
}

// Mesmas cores/limiares do HealthScoreGauge (src/components/dashboard/HealthScoreGauge.tsx),
// já validadas contra o fundo escuro do app — mantém o mesmo "vocabulário" visual
// de score entre o Portal Cliente e o Portal Gestor.
function scoreColor(score: number) {
  if (score >= 75) return '#199E70'
  if (score >= 50) return '#eda100'
  return '#e34948'
}

export function ProductivityGauge({ value }: ProductivityGaugeProps) {
  const safeValue = value ?? 0
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - safeValue / 100)
  const color = scoreColor(safeValue)

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4 text-purple-400" />
          Produtividade da equipe
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4 p-0 pt-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="#1A2540" strokeWidth="8" />
            {value !== null && (
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-foreground">
            {value !== null ? `${Math.round(value)}%` : '—'}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Proporção de tarefas concluídas em relação ao total de tarefas da agência.
        </p>
      </CardContent>
    </Card>
  )
}
