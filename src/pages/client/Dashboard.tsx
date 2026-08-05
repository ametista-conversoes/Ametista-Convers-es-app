import { CheckCircle2, DollarSign, Gauge, Target, TrendingUp } from 'lucide-react'
import { AssignedTasksCard } from '@/components/dashboard/AssignedTasksCard'
import { EmergencyPauseButton } from '@/components/dashboard/EmergencyPauseButton'
import { FinancialSummaryCard } from '@/components/dashboard/FinancialSummaryCard'
import { GoalsProgressCard } from '@/components/dashboard/GoalsProgressCard'
import { HealthScoreGauge } from '@/components/dashboard/HealthScoreGauge'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { NotificationsCard } from '@/components/dashboard/NotificationsCard'
import { UpcomingMeetingsCard } from '@/components/dashboard/UpcomingMeetingsCard'
import { useAuth } from '@/contexts/AuthContext'
import {
  useAlerts,
  useClient,
  useProjects,
  useSmartGoals,
  useTasks,
  useUpcomingMeetings,
} from '@/hooks/useClientPortalData'
import { formatCurrency, formatMultiplier, formatNumber } from '@/lib/format'
import { kpiDescriptions } from '@/lib/kpi-descriptions'
import { aggregateProjectKpis } from '@/lib/metrics'

export default function Dashboard() {
  const { clientId } = useAuth()
  const { data: client, isLoading: loadingClient } = useClient()
  const { data: projects, isLoading: loadingProjects } = useProjects()
  const { data: tasks } = useTasks()
  const { data: meetings } = useUpcomingMeetings()
  const { data: goals } = useSmartGoals()
  const { data: alerts } = useAlerts()

  if (!clientId) {
    return (
      <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6 text-sm text-muted-foreground">
        Esta conta não está vinculada a nenhum cliente, então não há um Dashboard para mostrar. Esta tela é do
        Portal do Cliente.
      </div>
    )
  }

  if (loadingClient || loadingProjects) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const kpis = aggregateProjectKpis(projects ?? [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Cliente</p>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        </div>
        <EmergencyPauseButton />
      </div>

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          <KpiCard
            label="Investimento"
            value={formatCurrency(kpis.spend)}
            icon={DollarSign}
            description={kpiDescriptions.investimento}
          />
          <KpiCard
            label="Receita"
            value={formatCurrency(kpis.revenue)}
            icon={TrendingUp}
            description={kpiDescriptions.receita}
          />
          <KpiCard label="ROAS" value={formatMultiplier(kpis.roas)} icon={Gauge} description={kpiDescriptions.roas} />
          <KpiCard label="CPA" value={formatCurrency(kpis.cpa)} icon={Target} description={kpiDescriptions.cpa} />
          <KpiCard
            label="Conversões"
            value={formatNumber(kpis.conversions)}
            icon={CheckCircle2}
            description={kpiDescriptions.conversoes}
          />
        </div>
      </div>

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          <HealthScoreGauge
            score={client?.health_score ?? null}
            subScores={[
              { label: 'Desempenho', value: client?.health_performance ?? null },
              { label: 'Financeiro', value: client?.health_financial ?? null },
              { label: 'Entrega', value: client?.health_delivery ?? null },
              { label: 'Relacionamento', value: client?.health_relationship ?? null },
            ]}
          />
          <UpcomingMeetingsCard meetings={meetings ?? []} />
          <AssignedTasksCard tasks={tasks ?? []} />
          <FinancialSummaryCard monthlyFee={client?.monthly_fee ?? null} spend={kpis.spend} revenue={kpis.revenue} />
          <GoalsProgressCard goals={goals ?? []} />
          <NotificationsCard alerts={alerts ?? []} />
        </div>
      </div>
    </div>
  )
}
