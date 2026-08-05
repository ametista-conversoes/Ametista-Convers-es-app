import {
  AlertTriangle,
  Briefcase,
  DollarSign,
  Siren,
  TrendingDown,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { AtRiskClientsList } from '@/components/admin/AtRiskClientsList'
import { ProductivityGauge } from '@/components/admin/ProductivityGauge'
import { RecentIncidentsList } from '@/components/admin/RecentIncidentsList'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { useAllClients, useAllIncidents, useAllProjects, useAllTasks } from '@/hooks/useManagerPortalData'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { kpiDescriptions } from '@/lib/kpi-descriptions'
import { computeExecutiveKpis } from '@/lib/manager-metrics'

export default function DashboardExecutivo() {
  const { data: clients, isLoading: loadingClients } = useAllClients()
  const { data: incidents, isLoading: loadingIncidents } = useAllIncidents()
  const { data: tasks, isLoading: loadingTasks } = useAllTasks()
  const { data: projects, isLoading: loadingProjects } = useAllProjects()

  if (loadingClients || loadingIncidents || loadingTasks || loadingProjects) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const kpis = computeExecutiveKpis(clients ?? [], incidents ?? [], tasks ?? [], projects ?? [])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Portal Gestor</p>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard Executivo</h1>
      </div>

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          <KpiCard
            label="MRR Total"
            value={formatCurrency(kpis.mrrTotal)}
            icon={DollarSign}
            description={kpiDescriptions.mrrTotal}
          />
          <KpiCard
            label="Clientes Ativos"
            value={formatNumber(kpis.activeClients)}
            icon={Users}
            description={kpiDescriptions.clientesAtivos}
          />
          <KpiCard
            label="Churn Rate"
            value={formatPercent(kpis.churnRate)}
            icon={TrendingDown}
            description={kpiDescriptions.churnRate}
          />
          <KpiCard
            label="Incidentes Abertos"
            value={formatNumber(kpis.openIncidents)}
            icon={Siren}
            description={kpiDescriptions.incidentesAbertos}
          />
          <KpiCard
            label="Clientes em Risco"
            value={formatNumber(kpis.atRiskClients)}
            icon={AlertTriangle}
            description={kpiDescriptions.clientesEmRisco}
          />
          <KpiCard
            label="Carga de Trabalho"
            value={formatNumber(kpis.workload)}
            icon={Briefcase}
            description={kpiDescriptions.cargaDeTrabalho}
          />
          <KpiCard
            label="Produtividade"
            value={formatPercent(kpis.productivity)}
            icon={Zap}
            description={kpiDescriptions.produtividade}
          />
          <KpiCard
            label="Budget Gerenciado"
            value={formatCurrency(kpis.managedBudget)}
            icon={Wallet}
            description={kpiDescriptions.budgetGerenciado}
          />
        </div>
      </div>

      <div className="content-grid-container">
        <div className="content-grid gap-4">
          <ProductivityGauge value={kpis.productivity} />
          <AtRiskClientsList clients={clients ?? []} />
          <RecentIncidentsList incidents={incidents ?? []} />
        </div>
      </div>
    </div>
  )
}
