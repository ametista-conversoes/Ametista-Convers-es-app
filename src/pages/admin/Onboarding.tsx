import { useState } from 'react'
import { ListChecks } from 'lucide-react'
import { NewOnboardingStepDialog } from '@/components/onboarding/NewOnboardingStepDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ManagerOnboardingStepRecord } from '@/hooks/useManagerPortalData'
import {
  useAllClients,
  useAllOnboardingSteps,
  useToggleManagerOnboardingStep,
} from '@/hooks/useManagerPortalData'

const ALL_CLIENTS = 'all'

export default function Onboarding() {
  const { data: clients } = useAllClients()
  const { data: steps, isLoading } = useAllOnboardingSteps()
  const toggleStep = useToggleManagerOnboardingStep()
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const visibleClients = (clients ?? []).filter(
    (client) => clientFilter === ALL_CLIENTS || client.id === clientFilter,
  )
  const stepsByClient = new Map<string, ManagerOnboardingStepRecord[]>()
  for (const step of steps ?? []) {
    const list = stepsByClient.get(step.client_id) ?? []
    list.push(step)
    stepsByClient.set(step.client_id, list)
  }
  const clientsWithSteps = visibleClients.filter((client) => (stepsByClient.get(client.id)?.length ?? 0) > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Onboarding</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLIENTS}>Todos os clientes</SelectItem>
              {(clients ?? []).map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NewOnboardingStepDialog />
        </div>
      </div>

      {clientsWithSteps.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma etapa de onboarding cadastrada ainda.</p>
      )}

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          {clientsWithSteps.map((client) => {
            const clientSteps = stepsByClient.get(client.id) ?? []
            const total = clientSteps.length
            const done = clientSteps.filter((step) => step.completed).length
            const percent = total > 0 ? Math.round((done / total) * 100) : 0

            return (
              <Card
                key={client.id}
                className="flex flex-col rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6"
              >
                <CardHeader className="p-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ListChecks className="h-4 w-4 text-purple-400" />
                    {client.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-0 pt-4">
                  <div>
                    <Progress value={percent} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {done} de {total} etapas concluídas ({percent}%)
                    </p>
                  </div>
                  <div className="space-y-2">
                    {clientSteps.map((step) => (
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
