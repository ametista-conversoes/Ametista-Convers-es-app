import { getGoalDeadlineStatus, getTodayIsoDate } from '@/lib/format'
import type {
  ManagerAlertRecord,
  ManagerIncidentRecord,
  ManagerSmartGoalRecord,
  ManagerTaskRecord,
} from '@/hooks/useManagerPortalData'

interface ClientRiskInputs {
  incidents: ManagerIncidentRecord[]
  alerts: ManagerAlertRecord[]
  tasks: ManagerTaskRecord[]
  goals: ManagerSmartGoalRecord[]
}

/** "Em problemas" não é um status salvo — é calculado na hora a partir de
 * sinais recentes do cliente. Qualquer uma das condições abaixo já é
 * suficiente:
 * - alguma meta SMART passou do prazo sem ser concluída
 * - 2+ incidentes médios abertos, ou 1+ incidente alto/crítico aberto
 * - 4+ tarefas atrasadas (prazo passado, não concluídas) em algum projeto
 * - 2+ alertas médios não resolvidos, ou 1+ alerta alto/crítico não resolvido */
export function computeClientHasProblems(clientId: string, { incidents, alerts, tasks, goals }: ClientRiskInputs): boolean {
  const today = getTodayIsoDate()

  const hasOverdueGoal = goals.some(
    (goal) => goal.client_id === clientId && getGoalDeadlineStatus(goal.target_date, goal.status) === 'overdue',
  )

  const activeIncidents = incidents.filter(
    (incident) => incident.client_id === clientId && (incident.status === 'open' || incident.status === 'in_progress'),
  )
  const mediumIncidents = activeIncidents.filter((incident) => incident.severity === 'medium').length
  const highOrCriticalIncidents = activeIncidents.filter(
    (incident) => incident.severity === 'high' || incident.severity === 'critical',
  ).length

  const overdueTasks = tasks.filter(
    (task) => task.client_id === clientId && task.status !== 'done' && !!task.due_date && task.due_date < today,
  ).length

  const activeAlerts = alerts.filter((alert) => alert.client_id === clientId && !alert.resolved)
  const mediumAlerts = activeAlerts.filter((alert) => alert.severity === 'medium').length
  const highOrCriticalAlerts = activeAlerts.filter(
    (alert) => alert.severity === 'high' || alert.severity === 'critical',
  ).length

  return (
    hasOverdueGoal ||
    mediumIncidents >= 2 ||
    highOrCriticalIncidents >= 1 ||
    overdueTasks >= 4 ||
    mediumAlerts >= 2 ||
    highOrCriticalAlerts >= 1
  )
}
