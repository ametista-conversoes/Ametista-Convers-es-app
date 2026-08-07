import { Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ManagerSmartGoalRecord } from '@/hooks/useManagerPortalData'
import { smartGoalStatusLabels, smartGoalStatusStyles } from '@/lib/status-styles'
import { UpdateGoalProgressDialog } from './UpdateGoalProgressDialog'

interface SmartGoalCardProps {
  goal: ManagerSmartGoalRecord
}

export function SmartGoalCard({ goal }: SmartGoalCardProps) {
  const target = goal.target_value ?? 0
  const current = goal.current_value ?? 0
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

  return (
    <Card className="flex flex-col rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 shrink-0 text-purple-400" />
          <span className="truncate">{goal.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-0 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground/70">{goal.client?.name ?? 'Cliente'}</p>
          <Badge className={smartGoalStatusStyles[goal.status]}>
            {smartGoalStatusLabels[goal.status] ?? goal.status}
          </Badge>
        </div>

        <div>
          <Progress value={percent} />
          <p className="mt-1 text-xs text-muted-foreground">
            {current} de {target} ({percent}%){goal.period ? ` · ${goal.period}` : ''}
          </p>
        </div>

        <div className="mt-auto pt-2">
          <UpdateGoalProgressDialog goal={goal} />
        </div>
      </CardContent>
    </Card>
  )
}
