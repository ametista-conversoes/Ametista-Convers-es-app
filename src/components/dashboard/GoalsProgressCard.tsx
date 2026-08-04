import { Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { SmartGoalRecord } from '@/hooks/useClientPortalData'
import { smartGoalStatusLabels, smartGoalStatusStyles } from '@/lib/status-styles'

interface GoalsProgressCardProps {
  goals: SmartGoalRecord[]
}

export function GoalsProgressCard({ goals }: GoalsProgressCardProps) {
  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-purple-400" />
          Objetivos &amp; metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0 pt-4">
        {goals.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada.</p>}
        {goals.map((goal) => {
          const target = goal.target_value ?? 0
          const current = goal.current_value ?? 0
          const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
          return (
            <div key={goal.id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-foreground">{goal.title}</span>
                <Badge className={smartGoalStatusStyles[goal.status]}>
                  {smartGoalStatusLabels[goal.status] ?? goal.status}
                </Badge>
              </div>
              <Progress value={percent} />
              <p className="mt-1 text-xs text-muted-foreground">
                {current} de {target} ({percent}%)
              </p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
