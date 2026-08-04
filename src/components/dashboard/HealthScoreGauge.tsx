import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface SubScore {
  label: string
  value: number | null
}

interface HealthScoreGaugeProps {
  score: number | null
  subScores: SubScore[]
}

function scoreColor(score: number) {
  if (score >= 75) return '#199E70'
  if (score >= 50) return '#eda100'
  return '#e34948'
}

export function HealthScoreGauge({ score, subScores }: HealthScoreGaugeProps) {
  const [expanded, setExpanded] = useState(false)
  const safeScore = score ?? 0
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - safeScore / 100)
  const color = scoreColor(safeScore)

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0">
            <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
              <circle cx="48" cy="48" r={radius} fill="none" stroke="#1A2540" strokeWidth="8" />
              {score !== null && (
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
              {score ?? '—'}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Health Score</p>
            <p className="text-xs text-muted-foreground/70">Clique para ver o detalhamento</p>
          </div>
        </div>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="mt-5 space-y-4 border-t border-[#1A2540] pt-4">
          {subScores.map((s) => (
            <div key={s.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="text-foreground">{s.value ?? '—'}</span>
              </div>
              <Progress value={s.value ?? 0} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
