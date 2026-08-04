import { ListChecks } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useToggleOnboardingStep } from '@/hooks/useClientPortalData'
import type { OnboardingStepRecord } from '@/hooks/useClientPortalData'

interface OnboardingChecklistProps {
  steps: OnboardingStepRecord[]
}

export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  const toggleStep = useToggleOnboardingStep()

  const total = steps.length
  const done = steps.filter((step) => step.completed).length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-purple-400" />
          Checklist de onboarding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0 pt-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma etapa de onboarding cadastrada.</p>
        ) : (
          <>
            <div>
              <Progress value={percent} />
              <p className="mt-1 text-xs text-muted-foreground">
                {done} de {total} etapas concluídas ({percent}%)
              </p>
            </div>
            <div className="space-y-2">
              {steps.map((step) => (
                <label
                  key={step.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <Checkbox
                    checked={step.completed}
                    disabled={toggleStep.isPending}
                    onCheckedChange={(checked) =>
                      toggleStep.mutate({ stepId: step.id, completed: checked === true })
                    }
                  />
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm ${step.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                    >
                      {step.title}
                    </p>
                    {step.category && <p className="text-xs text-muted-foreground">{step.category}</p>}
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
