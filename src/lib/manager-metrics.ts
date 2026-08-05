import type {
  ManagerClientRecord,
  ManagerIncidentRecord,
  ManagerProjectRecord,
  ManagerTaskRecord,
} from '@/hooks/useManagerPortalData'

export interface ExecutiveKpis {
  mrrTotal: number
  activeClients: number
  churnRate: number | null
  openIncidents: number
  atRiskClients: number
  workload: number
  productivity: number | null
  managedBudget: number
}

const OPEN_TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review']

/**
 * Calcula os 8 KPIs do Dashboard Executivo a partir dos dados já
 * carregados (clientes, incidentes, tarefas e projetos da agência
 * inteira, sem filtro por client_id).
 */
export function computeExecutiveKpis(
  clients: ManagerClientRecord[],
  incidents: ManagerIncidentRecord[],
  tasks: ManagerTaskRecord[],
  projects: ManagerProjectRecord[],
): ExecutiveKpis {
  const activeClients = clients.filter((c) => c.status === 'active')
  const churnedClients = clients.filter((c) => c.status === 'churned')

  const mrrTotal = activeClients.reduce((sum, c) => sum + (c.monthly_fee ?? 0), 0)
  const churnRate = clients.length > 0 ? (churnedClients.length / clients.length) * 100 : null
  const openIncidents = incidents.filter((i) => i.status === 'open' || i.status === 'in_progress').length
  const atRiskClients = clients.filter((c) => (c.health_score ?? 100) < 50).length

  const openTasks = tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status)).length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const productivity = tasks.length > 0 ? (doneTasks / tasks.length) * 100 : null

  const managedBudget = projects
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + (p.spend ?? 0), 0)

  return {
    mrrTotal,
    activeClients: activeClients.length,
    churnRate,
    openIncidents,
    atRiskClients,
    workload: openTasks,
    productivity,
    managedBudget,
  }
}
