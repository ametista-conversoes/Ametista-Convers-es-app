import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { aggregateAudienceInsights, type AudienceRawResponse } from '@/lib/audience-insights'
import { fetchLatestUpdatedAt, latestOf } from '@/lib/nav-activity'
import { severityRank } from '@/lib/status-styles'
import { supabase } from '@/lib/supabase'

export interface ManagerClientRecord {
  id: string
  name: string
  company: string | null
  email: string | null
  status: string
  plan: string | null
  monthly_fee: number | null
  health_score: number | null
  phone: string | null
  logo_url: string | null
  renewal_date: string | null
  internal_notes: string | null
  default_workflow_template_id: string | null
  leads_to_close: number | null
  average_ticket: number | null
}

export interface ManagerIncidentRecord {
  id: string
  title: string
  client_id: string
  severity: string
  status: string
  category: string | null
  description: string | null
  resolution: string | null
  created_at: string
  client: { name: string } | null
}

export interface ManagerAlertRecord {
  id: string
  title: string
  message: string | null
  client_id: string
  severity: string
  category: string | null
  resolved: boolean
  created_at: string
  client: { name: string } | null
}

export interface TimelineEventRecord {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  client_id: string | null
  severity: string
  created_at: string
  client: { name: string } | null
}

export interface ManagerProjectRecord {
  id: string
  title: string
  client_id: string
  status: string
  spend: number | null
  objective: string | null
  description: string | null
  icp: string | null
  segmentations: string[]
  systems: string | null
  channel: string | null
  cpa: number | null
  roas: number | null
  ctr: number | null
  revenue: number | null
  health_score: number | null
  start_date: string | null
  end_date: string | null
  external_connection_id: string | null
  external_campaign_id: string | null
  external_campaign_name: string | null
}

export interface ManagerTaskRecord {
  id: string
  title: string
  description: string | null
  client_id: string
  project_id: string | null
  status: string
  priority: string
  category: string | null
  due_date: string | null
  client: { name: string } | null
}

export function useAllClients() {
  return useQuery({
    queryKey: ['manager-clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true })
      if (error) throw error
      return data as ManagerClientRecord[]
    },
  })
}

export function useManagerClient(clientId: string | null) {
  return useQuery({
    queryKey: ['manager-client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', clientId as string).single()
      if (error) throw error
      return data as ManagerClientRecord
    },
    enabled: !!clientId,
  })
}

export interface UpdateClientDetailsInput {
  id: string
  name: string
  company: string | null
  email: string | null
  plan: string | null
  monthly_fee: number | null
  phone: string | null
  logo_url: string | null
  renewal_date: string | null
  internal_notes: string | null
  leads_to_close: number | null
  average_ticket: number | null
}

export function useUpdateClientDetails() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateClientDetailsInput) => {
      const { error } = await supabase.from('clients').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['manager-clients'] })
      queryClient.invalidateQueries({ queryKey: ['manager-client', id] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar os dados do cliente.')
    },
  })
}

export function useUpdateClientStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientId, status }: { clientId: string; status: string }) => {
      const { error } = await supabase.from('clients').update({ status }).eq('id', clientId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-clients'] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar o status do cliente.')
    },
  })
}

export function useRecomputeClientHealthScore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase.rpc('recompute_client_health_score', { p_client_id: clientId })
      if (error) throw error
    },
    onSuccess: (_data, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['manager-client', clientId] })
      queryClient.invalidateQueries({ queryKey: ['manager-clients'] })
    },
    onError: () => {
      toast.error('Não foi possível recalcular o Health Score do cliente.')
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', clientId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-clients'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir o cliente.')
    },
  })
}

export function useAllIncidents() {
  return useQuery({
    queryKey: ['manager-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*, client:clients(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      // Mais severo primeiro; sort é estável, então quem tem a mesma
      // severidade mantém a ordem por data mais recente já vinda do banco.
      return (data as unknown as ManagerIncidentRecord[]).sort(
        (a, b) => severityRank[b.severity] - severityRank[a.severity],
      )
    },
  })
}

export interface NewIncidentInput {
  title: string
  client_id: string
  severity: string
  category: string | null
  description: string | null
}

export function useCreateIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewIncidentInput) => {
      const { error } = await supabase.from('incidents').insert({ ...input, status: 'open' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-incidents'] })
      queryClient.invalidateQueries({ queryKey: ['manager-timeline'] })
    },
    onError: () => {
      toast.error('Não foi possível criar o incidente.')
    },
  })
}

export function useResolveIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ incidentId, resolution }: { incidentId: string; resolution: string }) => {
      const { error } = await supabase
        .from('incidents')
        .update({ status: 'resolved', resolution })
        .eq('id', incidentId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-incidents'] })
      queryClient.invalidateQueries({ queryKey: ['manager-timeline'] })
    },
    onError: () => {
      toast.error('Não foi possível resolver o incidente.')
    },
  })
}

export function useDeleteIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (incidentId: string) => {
      const { error } = await supabase.from('incidents').delete().eq('id', incidentId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-incidents'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir o incidente.')
    },
  })
}

export function useAllAlerts() {
  return useQuery({
    queryKey: ['manager-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, client:clients(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      // Mais severo primeiro (mesmo critério de useAllIncidents).
      return (data as unknown as ManagerAlertRecord[]).sort(
        (a, b) => severityRank[b.severity] - severityRank[a.severity],
      )
    },
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.from('alerts').update({ resolved: true }).eq('id', alertId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['manager-timeline'] })
    },
    onError: () => {
      toast.error('Não foi possível resolver o alerta.')
    },
  })
}

export function useDeleteAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.from('alerts').delete().eq('id', alertId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-alerts'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir o alerta.')
    },
  })
}

// Fase 21.1: monitoramento de erros (tipo Sentry, próprio) — captura
// tanto erro de front-end (ErrorBoundary/window.onerror, ver
// src/lib/error-logging.ts) quanto de Edge Function (logServerError
// nos 3 arquivos em supabase/functions/*/index.ts).
export interface ErrorLogRecord {
  id: string
  source: 'frontend' | 'edge_function'
  function_name: string | null
  message: string
  stack: string | null
  context: unknown
  severity: string
  resolved: boolean
  created_at: string
}

export function useErrorLogs() {
  return useQuery({
    queryKey: ['error-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data as ErrorLogRecord[]
    },
  })
}

export function useResolveErrorLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('error_logs').update({ resolved: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] })
    },
    onError: () => {
      toast.error('Não foi possível marcar o erro como resolvido.')
    },
  })
}

// Fase 21.2: alerta automático por limiar de métrica, configurado por
// cliente na Central de Informações — a checagem de verdade roda no
// banco (check_metric_alert_thresholds, chamada a cada sync).
export interface MetricAlertThresholdRecord {
  id: string
  client_id: string
  metric: string
  comparison: 'above' | 'below'
  threshold_value: number
  enabled: boolean
}

export function useMetricAlertThresholds(clientId: string | null) {
  return useQuery({
    queryKey: ['metric-alert-thresholds', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_alert_thresholds')
        .select('*')
        .eq('client_id', clientId as string)
      if (error) throw error
      return data as MetricAlertThresholdRecord[]
    },
    enabled: !!clientId,
  })
}

export function useUpsertMetricAlertThreshold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      client_id: string
      metric: string
      comparison: 'above' | 'below'
      threshold_value: number
      enabled: boolean
    }) => {
      const { error } = await supabase.from('metric_alert_thresholds').upsert(input, { onConflict: 'client_id,metric' })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['metric-alert-thresholds', variables.client_id] })
    },
    onError: () => {
      toast.error('Não foi possível salvar o limiar de alerta.')
    },
  })
}

export function useDeleteErrorLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('error_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir o log de erro.')
    },
  })
}

export function useTimelineEvents() {
  return useQuery({
    queryKey: ['manager-timeline'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, client:clients(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as TimelineEventRecord[]
    },
  })
}

export function useAllProjects() {
  return useQuery({
    queryKey: ['manager-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, title, client_id, status, spend, objective, description, icp, segmentations, systems, channel, cpa, roas, ctr, revenue, health_score, start_date, end_date, external_connection_id, external_campaign_id, external_campaign_name',
        )
      if (error) throw error
      return data as ManagerProjectRecord[]
    },
  })
}

export interface NewProjectInput {
  title: string
  client_id: string
  objective: string | null
  description: string | null
  external_connection_id?: string | null
  external_campaign_id?: string | null
  external_campaign_name?: string | null
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewProjectInput) => {
      const { error } = await supabase.from('projects').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-projects'] })
    },
    onError: () => {
      toast.error('Não foi possível criar o projeto.')
    },
  })
}

export interface UpdateProjectCampaignInput {
  id: string
  icp?: string | null
  segmentations?: string[]
  objective?: string | null
  systems?: string | null
  description?: string | null
  external_connection_id?: string | null
  external_campaign_id?: string | null
  external_campaign_name?: string | null
  revenue?: number | null
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProjectCampaignInput) => {
      const { error } = await supabase.from('projects').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-projects'] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar o projeto.')
    },
  })
}

export interface CampaignPerformance {
  spend: number
  clicks: number
  impressions: number
  conversions: number
  cpa: number | null
  ctr: number | null
}

/** Últimos 30 dias de `campaign_performance_snapshots` pra uma campanha
 * vinculada (Fase 8.1b). Sem ROAS/receita — os provedores de anúncio
 * não reportam isso nessa sincronização (mesma limitação que já existe
 * hoje pro agregado por conta em `performance_snapshots`). */
export function useCampaignPerformance(connectionId: string | null, campaignId: string | null) {
  return useQuery({
    queryKey: ['campaign-performance', connectionId, campaignId],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('campaign_performance_snapshots')
        .select('spend, clicks, impressions, conversions')
        .eq('connection_id', connectionId as string)
        .eq('external_campaign_id', campaignId as string)
        .gte('snapshot_date', since)
      if (error) throw error

      type Totals = { spend: number; clicks: number; impressions: number; conversions: number }
      const rows = data as Array<{ spend: number | null; clicks: number | null; impressions: number | null; conversions: number | null }>
      const totals = rows.reduce<Totals>(
        (acc, row) => ({
          spend: acc.spend + (row.spend ?? 0),
          clicks: acc.clicks + (row.clicks ?? 0),
          impressions: acc.impressions + (row.impressions ?? 0),
          conversions: acc.conversions + (row.conversions ?? 0),
        }),
        { spend: 0, clicks: 0, impressions: 0, conversions: 0 },
      )

      return {
        ...totals,
        cpa: totals.conversions > 0 ? totals.spend / totals.conversions : null,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : null,
      } as CampaignPerformance
    },
    enabled: !!connectionId && !!campaignId,
  })
}

export function useAllTasks() {
  return useQuery({
    queryKey: ['manager-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, client_id, project_id, status, priority, category, due_date, client:clients(name)')
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as ManagerTaskRecord[]
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar o status da tarefa.')
    },
  })
}

export function useDeleteManagerTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir a tarefa.')
    },
  })
}

export interface NewManagerTaskInput {
  title: string
  client_id: string
  project_id: string | null
  category: string | null
  priority: string
  due_date: string | null
}

export function useCreateManagerTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewManagerTaskInput) => {
      const { error } = await supabase.from('tasks').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] })
    },
    onError: () => {
      toast.error('Não foi possível criar a tarefa.')
    },
  })
}

export function useUpdateManagerTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: NewManagerTaskInput & { id: string }) => {
      const { error } = await supabase.from('tasks').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar a tarefa.')
    },
  })
}

export function useApplyWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      clientId,
      projectId,
      workflowName,
      steps,
      activityTemplateIds,
    }: {
      clientId: string
      projectId: string | null
      workflowName: string
      steps: { title: string; category: string }[]
      activityTemplateIds?: string[]
    }) => {
      const { error } = await supabase.rpc('apply_workflow', {
        p_client_id: clientId,
        p_project_id: projectId,
        p_workflow_name: workflowName,
        p_steps: steps,
        p_activity_template_ids: activityTemplateIds ?? [],
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['manager-timeline'] })
      queryClient.invalidateQueries({ queryKey: ['activity-checklist-items'] })
    },
    onError: () => {
      toast.error('Não foi possível aplicar o workflow.')
    },
  })
}

/** Só uma pré-seleção de conveniência (Fase 14) — não aplica nada
 * sozinho, só lembra qual workflow costuma ser usado nesse cliente. */
export function useSetClientDefaultWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientId, workflowTemplateId }: { clientId: string; workflowTemplateId: string }) => {
      const { error } = await supabase
        .from('clients')
        .update({ default_workflow_template_id: workflowTemplateId })
        .eq('id', clientId)
      if (error) throw error
    },
    onSuccess: (_data, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['manager-clients'] })
      queryClient.invalidateQueries({ queryKey: ['manager-client', clientId] })
    },
    onError: () => {
      toast.error('Não foi possível salvar o workflow padrão do cliente.')
    },
  })
}

export interface WorkflowTemplateStep {
  title: string
  category: string
  /** Prazo em dias — quando aplicado, a tarefa nasce com due_date =
   * hoje + esse número (calculado no banco, ver apply_workflow /
   * apply_client_workflow). Sem valor, a tarefa não ganha prazo. */
  due_days?: number | null
}

export interface WorkflowTemplateRecord {
  id: string
  name: string
  description: string | null
  steps: WorkflowTemplateStep[]
  /** Workflows de Atividades disparados junto quando esse workflow é
   * aplicado (Fase 6.6.2) — ids de `activity_templates`. */
  activity_template_ids: string[]
}

export function useWorkflowTemplates() {
  return useQuery({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('id, name, description, steps, activity_template_ids')
        .order('name', { ascending: true })
      if (error) throw error
      return data as unknown as WorkflowTemplateRecord[]
    },
  })
}

export interface NewWorkflowTemplateInput {
  name: string
  description: string | null
  steps: WorkflowTemplateStep[]
  activity_template_ids: string[]
}

export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewWorkflowTemplateInput) => {
      const { error } = await supabase.from('workflow_templates').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível criar o modelo de workflow.')
    },
  })
}

export function useDeleteWorkflowTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from('workflow_templates').delete().eq('id', templateId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir o modelo de workflow.')
    },
  })
}

export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: NewWorkflowTemplateInput & { id: string }) => {
      const { error } = await supabase.from('workflow_templates').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar o modelo de workflow.')
    },
  })
}

// Workflows do Cliente (Fase 6.5.2) — mesmo modelo de workflow_templates,
// mas aplicado direto a um ou mais clientes (sem projeto), via
// apply_client_workflow.
export interface ClientWorkflowTemplateRecord {
  id: string
  name: string
  description: string | null
  steps: WorkflowTemplateStep[]
}

export function useClientWorkflowTemplates() {
  return useQuery({
    queryKey: ['client-workflow-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_workflow_templates')
        .select('id, name, description, steps')
        .order('name', { ascending: true })
      if (error) throw error
      return data as unknown as ClientWorkflowTemplateRecord[]
    },
  })
}

export interface NewClientWorkflowTemplateInput {
  name: string
  description: string | null
  steps: WorkflowTemplateStep[]
}

export function useCreateClientWorkflowTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewClientWorkflowTemplateInput) => {
      const { error } = await supabase.from('client_workflow_templates').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-workflow-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível criar o workflow do cliente.')
    },
  })
}

export function useUpdateClientWorkflowTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: NewClientWorkflowTemplateInput & { id: string }) => {
      const { error } = await supabase.from('client_workflow_templates').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-workflow-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar o workflow do cliente.')
    },
  })
}

export function useDeleteClientWorkflowTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from('client_workflow_templates').delete().eq('id', templateId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-workflow-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir o workflow do cliente.')
    },
  })
}

export function useApplyClientWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientIds, templateId }: { clientIds: string[]; templateId: string }) => {
      const { error } = await supabase.rpc('apply_client_workflow', {
        p_client_ids: clientIds,
        p_template_id: templateId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['manager-timeline'] })
    },
    onError: () => {
      toast.error('Não foi possível aplicar o workflow ao cliente.')
    },
  })
}

// Workflows de Atividades (Fase 6.6.2) — checklists reaproveitáveis de
// texto simples. Disparados junto de um Workflow do Kanban (ver
// activity_template_ids em WorkflowTemplateRecord) ou, quando marcados
// como padrão, aplicados sozinhos a todo cliente novo (trigger no
// banco, ver handle_new_client_activity_template).
export interface ActivityTemplateItem {
  title: string
  category?: string | null
}

export interface ActivityTemplateRecord {
  id: string
  name: string
  description: string | null
  items: ActivityTemplateItem[]
  is_default: boolean
}

export function useActivityTemplates() {
  return useQuery({
    queryKey: ['activity-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_templates')
        .select('id, name, description, items, is_default')
        .order('name', { ascending: true })
      if (error) throw error
      return data as unknown as ActivityTemplateRecord[]
    },
  })
}

export interface NewActivityTemplateInput {
  name: string
  description: string | null
  items: ActivityTemplateItem[]
}

export function useCreateActivityTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewActivityTemplateInput) => {
      const { error } = await supabase.from('activity_templates').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível criar o modelo de atividade.')
    },
  })
}

export function useUpdateActivityTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: NewActivityTemplateInput & { id: string }) => {
      const { error } = await supabase.from('activity_templates').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar o modelo de atividade.')
    },
  })
}

export function useDeleteActivityTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from('activity_templates').delete().eq('id', templateId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir o modelo de atividade.')
    },
  })
}

export function useSetDefaultActivityTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.rpc('set_default_activity_template', { p_template_id: templateId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível marcar o modelo como padrão.')
    },
  })
}

/** Diferente de "marcar como padrão" (que zera os outros via RPC — só
 * pode haver 1), desmarcar é um update direto e simples: a policy
 * "admin_full_activity_templates" já libera isso pra admin. */
export function useUnsetDefaultActivityTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from('activity_templates').update({ is_default: false }).eq('id', templateId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-templates'] })
    },
    onError: () => {
      toast.error('Não foi possível desmarcar o modelo como padrão.')
    },
  })
}

// Atividades (Fase 6.6.2) — itens já instanciados por cliente, exibidos
// na aba "Atividades" e na Central de Informações do Cliente.
export interface ActivityChecklistItemRecord {
  id: string
  client_id: string
  project_id: string | null
  title: string
  category: string | null
  completed: boolean
  step_order: number
  source_template_name: string | null
  client: { name: string } | null
}

export function useActivityChecklistItems() {
  return useQuery({
    queryKey: ['activity-checklist-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_checklist_items')
        .select(
          'id, client_id, project_id, title, category, completed, step_order, source_template_name, client:clients(name)',
        )
        .order('step_order', { ascending: true })
      if (error) throw error
      return data as unknown as ActivityChecklistItemRecord[]
    },
  })
}

export interface NewActivityChecklistItemInput {
  client_id: string
  title: string
  category: string | null
}

export function useCreateActivityChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewActivityChecklistItemInput) => {
      const { error } = await supabase.from('activity_checklist_items').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-checklist-items'] })
    },
    onError: () => {
      toast.error('Não foi possível criar o item da checklist.')
    },
  })
}

export function useToggleActivityChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      const { error } = await supabase.from('activity_checklist_items').update({ completed }).eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-checklist-items'] })
    },
    onError: () => {
      toast.error('Não foi possível marcar o item da checklist.')
    },
  })
}

export function useDeleteActivityChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('activity_checklist_items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-checklist-items'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir o item da checklist.')
    },
  })
}

export interface ManagerDigitalAssetRecord {
  id: string
  name: string
  type: string | null
  client_id: string
  platform: string | null
  status: string
  url: string | null
  code: string | null
  client: { name: string } | null
}

export function useAllDigitalAssets() {
  return useQuery({
    queryKey: ['manager-digital-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_assets')
        .select('*, client:clients(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as ManagerDigitalAssetRecord[]
    },
  })
}

export interface DigitalAssetConnectionRecord {
  id: string
  digital_asset_id: string
  provider: string
  status: string
  project_id: string | null
  external_account_id: string | null
  last_synced_at: string | null
}

/** Conexões de integração (Fase 6.1/6.2) — quem escreve aqui é sempre
 * a Edge Function "integrations" (service role); o app só lê, pra
 * mostrar o status "Conectado"/"Desconectado" no card do Ativo Digital. */
export function useDigitalAssetConnections() {
  return useQuery({
    queryKey: ['digital-asset-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_asset_connections')
        .select('id, digital_asset_id, provider, status, project_id, external_account_id, last_synced_at')
      if (error) throw error
      return data as DigitalAssetConnectionRecord[]
    },
  })
}

export interface FormQuestionRecord {
  id: string
  external_question_id: string
  title: string
  question_type: string
  options: string[] | null
  position: number | null
}

/** Perguntas estruturadas de um Google Forms conectado (Fase 8.2),
 * sincronizadas via API oficial (forms.googleapis.com) — usadas pra
 * rotular as respostas de `useFormResponses` pelo título real. */
export function useFormQuestions(connectionId: string | null) {
  return useQuery({
    queryKey: ['form-questions', connectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_questions')
        .select('id, external_question_id, title, question_type, options, position')
        .eq('connection_id', connectionId as string)
        .order('position', { ascending: true })
      if (error) throw error
      return data as FormQuestionRecord[]
    },
    enabled: !!connectionId,
  })
}

export interface FormAnswerRecord {
  external_question_id: string
  answer_text: string | null
  answer_values: string[] | null
}

export interface FormResponseRecord {
  id: string
  external_response_id: string
  submitted_at: string | null
  form_answers: FormAnswerRecord[]
}

/** Respostas estruturadas mais recentes de um Google Forms conectado
 * (Fase 8.2) — só uma vitrine pra confirmar que a sincronização trouxe
 * dado real; a síntese em % das perguntas fechadas fica pra Fase 8.3. */
export function useFormResponses(connectionId: string | null) {
  return useQuery({
    queryKey: ['form-responses', connectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select('id, external_response_id, submitted_at, form_answers(external_question_id, answer_text, answer_values)')
        .eq('connection_id', connectionId as string)
        .order('submitted_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as unknown as FormResponseRecord[]
    },
    enabled: !!connectionId,
  })
}

const CLOSED_QUESTION_TYPES = ['choice_radio', 'choice_checkbox', 'choice_dropdown', 'scale', 'grid_row']

/** Síntese em % das perguntas fechadas dos Google Forms conectados de
 * um cliente (Fase 8.3, "Públicos-Alvo") — 100% dinâmico: junta as
 * perguntas fechadas de TODOS os formulários conectados do cliente (0,
 * 1 ou vários), sem nenhuma lista de perguntas/opções fixa no código.
 * A agregação em si (`aggregateAudienceInsights`) é uma função pura em
 * `src/lib/audience-insights.ts`, coberta por teste automatizado. */
export function useAudienceInsights(clientId: string | null) {
  return useQuery({
    queryKey: ['audience-insights', clientId],
    queryFn: async () => {
      const { data: assets, error: assetsError } = await supabase
        .from('digital_assets')
        .select('id')
        .eq('client_id', clientId as string)
      if (assetsError) throw assetsError
      const assetIds = (assets ?? []).map((a) => a.id)
      if (assetIds.length === 0) return []

      const { data: connections, error: connectionsError } = await supabase
        .from('digital_asset_connections')
        .select('id')
        .eq('provider', 'google_forms')
        .in('digital_asset_id', assetIds)
      if (connectionsError) throw connectionsError
      const connectionIds = (connections ?? []).map((c) => c.id)
      if (connectionIds.length === 0) return []

      const { data: questions, error: questionsError } = await supabase
        .from('form_questions')
        .select('id, connection_id, external_question_id, title, question_type, position')
        .in('connection_id', connectionIds)
        .in('question_type', CLOSED_QUESTION_TYPES)
        .order('position', { ascending: true })
      if (questionsError) throw questionsError
      if (!questions || questions.length === 0) return []

      const { data: responses, error: responsesError } = await supabase
        .from('form_responses')
        .select('id, connection_id, form_answers(external_question_id, answer_text, answer_values)')
        .eq('client_id', clientId as string)
      if (responsesError) throw responsesError

      return aggregateAudienceInsights(questions, (responses ?? []) as unknown as AudienceRawResponse[])
    },
    enabled: !!clientId,
  })
}

const OPEN_QUESTION_TYPES = ['text_short', 'text_paragraph']

/** Respostas de texto livre dos Google Forms conectados de um cliente
 * (Fase 8.4, "Comunicação Persuasiva") — mesma ideia de
 * `useAudienceInsights`, mas pras perguntas abertas em vez das
 * fechadas. `connectionIds` já vem filtrado pelo seletor de Formulário
 * da própria página (`AudienceInsights.tsx`), não recalcula aqui. */
export function useOpenTextAnswers(clientId: string | null, connectionIds: string[]) {
  return useQuery({
    queryKey: ['open-text-answers', clientId, connectionIds],
    queryFn: async () => {
      const { data: questions, error: questionsError } = await supabase
        .from('form_questions')
        .select('external_question_id, connection_id')
        .in('connection_id', connectionIds)
        .in('question_type', OPEN_QUESTION_TYPES)
      if (questionsError) throw questionsError
      if (!questions || questions.length === 0) return []

      const openQuestionKeys = new Set(questions.map((q) => `${q.connection_id}|${q.external_question_id}`))

      const { data: responses, error: responsesError } = await supabase
        .from('form_responses')
        .select('connection_id, form_answers(external_question_id, answer_text)')
        .eq('client_id', clientId as string)
        .in('connection_id', connectionIds)
      if (responsesError) throw responsesError

      const answers: string[] = []
      for (const response of (responses ?? []) as unknown as Array<{
        connection_id: string
        form_answers: Array<{ external_question_id: string; answer_text: string | null }>
      }>) {
        for (const answer of response.form_answers) {
          if (!answer.answer_text?.trim()) continue
          if (!openQuestionKeys.has(`${response.connection_id}|${answer.external_question_id}`)) continue
          answers.push(answer.answer_text)
        }
      }
      return answers
    },
    enabled: !!clientId && connectionIds.length > 0,
  })
}

export interface NewDigitalAssetInput {
  name: string
  client_id: string
  type: string | null
  platform: string | null
  status: string
  url: string | null
  code: string | null
}

export function useCreateDigitalAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewDigitalAssetInput) => {
      const { error } = await supabase.from('digital_assets').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-digital-assets'] })
    },
    onError: () => {
      toast.error('Não foi possível criar o ativo digital.')
    },
  })
}

export function useUpdateDigitalAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: NewDigitalAssetInput & { id: string }) => {
      const { error } = await supabase.from('digital_assets').update(input).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-digital-assets'] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar o ativo digital.')
    },
  })
}

export function useUpdateDigitalAssetStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ assetId, status }: { assetId: string; status: string }) => {
      const { error } = await supabase.from('digital_assets').update({ status }).eq('id', assetId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-digital-assets'] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar o status do ativo digital.')
    },
  })
}

export function useDeleteDigitalAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase.from('digital_assets').delete().eq('id', assetId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-digital-assets'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir o ativo digital.')
    },
  })
}

export interface ManagerSmartGoalRecord {
  id: string
  title: string
  client_id: string
  metric_type: string | null
  target_value: number | null
  current_value: number | null
  target_date: string | null
  status: string
  client: { name: string } | null
}

export function useAllSmartGoals() {
  return useQuery({
    queryKey: ['manager-smart-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smart_goals')
        .select('*, client:clients(name)')
        .order('target_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as ManagerSmartGoalRecord[]
    },
  })
}

export interface NewSmartGoalInput {
  title: string
  client_id: string
  metric_type: string | null
  target_value: number | null
  current_value: number | null
  target_date: string | null
  status: string
}

export function useCreateSmartGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewSmartGoalInput) => {
      const { error } = await supabase.from('smart_goals').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-smart-goals'] })
    },
    onError: () => {
      toast.error('Não foi possível criar a meta.')
    },
  })
}

export function useUpdateSmartGoalProgress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      goalId,
      currentValue,
      status,
    }: {
      goalId: string
      currentValue: number
      status: string
    }) => {
      const { error } = await supabase
        .from('smart_goals')
        .update({ current_value: currentValue, status })
        .eq('id', goalId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-smart-goals'] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar o progresso da meta.')
    },
  })
}

export function useDeleteSmartGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from('smart_goals').delete().eq('id', goalId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-smart-goals'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir a meta.')
    },
  })
}

const COMMENTS_ENTITY_TYPE = 'general'

export interface ManagerCommentRecord {
  id: string
  title: string | null
  content: string
  author_id: string | null
  author_name: string | null
  author_role: string | null
  created_at: string
  audio_url: string | null
  audio_duration_seconds: number | null
}

export function useClientComments(clientId: string | null) {
  return useQuery({
    queryKey: ['manager-comments', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('client_id', clientId as string)
        .eq('entity_type', COMMENTS_ENTITY_TYPE)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as ManagerCommentRecord[]
    },
    enabled: !!clientId,
  })
}

export function useCreateManagerComment() {
  const { user, fullName, role } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      clientId,
      title,
      content,
      audioUrl,
      audioDurationSeconds,
    }: {
      clientId: string
      title: string | null
      content: string
      audioUrl?: string
      audioDurationSeconds?: number
    }) => {
      const { error } = await supabase.from('comments').insert({
        title,
        content,
        client_id: clientId,
        entity_type: COMMENTS_ENTITY_TYPE,
        entity_id: clientId,
        author_id: user?.id,
        author_name: fullName,
        author_role: role,
        audio_url: audioUrl ?? null,
        audio_duration_seconds: audioDurationSeconds ?? null,
      })
      if (error) throw error
    },
    onSuccess: (_data, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['manager-comments', clientId] })
    },
    onError: () => {
      toast.error('Não foi possível enviar o comentário.')
    },
  })
}

export interface ManagerMeetingRecord {
  id: string
  title: string
  client_id: string
  date: string | null
  meeting_link: string | null
  status: string
  cancellation_reason: string | null
  cancelled_by_role: string | null
  client: { name: string } | null
}

export function useAllMeetings() {
  return useQuery({
    queryKey: ['manager-meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*, client:clients(name)')
        .order('date', { ascending: true })
      if (error) throw error
      return data as unknown as ManagerMeetingRecord[]
    },
  })
}

export interface NewManagerMeetingInput {
  title: string
  client_id: string
  date: string
  meeting_link: string | null
}

export function useCreateManagerMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewManagerMeetingInput) => {
      const { error } = await supabase.from('meetings').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-meetings'] })
    },
    onError: () => {
      toast.error('Não foi possível agendar a reunião.')
    },
  })
}

export function useCancelManagerMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ meetingId, reason }: { meetingId: string; reason: string }) => {
      const { error } = await supabase.rpc('cancel_meeting', { meeting_id: meetingId, reason })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-meetings'] })
    },
    onError: () => {
      toast.error('Não foi possível cancelar a reunião.')
    },
  })
}

export function useDeleteManagerMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (meetingId: string) => {
      const { error } = await supabase.from('meetings').delete().eq('id', meetingId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-meetings'] })
    },
    onError: () => {
      toast.error('Não foi possível excluir a reunião.')
    },
  })
}

export function useCompleteManagerMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (meetingId: string) => {
      const { error } = await supabase.rpc('complete_meeting', { meeting_id: meetingId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-meetings'] })
    },
    onError: () => {
      toast.error('Não foi possível concluir a reunião.')
    },
  })
}

export interface ClientMeetingRecurrenceRecord {
  client_id: string
  active: boolean
}

export function useClientMeetingRecurrence(clientId: string | null) {
  return useQuery({
    queryKey: ['manager-meeting-recurrence', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_meeting_recurrence')
        .select('client_id, active')
        .eq('client_id', clientId as string)
        .maybeSingle()
      if (error) throw error
      return data as ClientMeetingRecurrenceRecord | null
    },
    enabled: !!clientId,
  })
}

export function useEnrollMeetingRecurrence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase.rpc('enroll_client_meeting_recurrence', { p_client_id: clientId })
      if (error) throw error
    },
    onSuccess: (_data, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['manager-meeting-recurrence', clientId] })
      queryClient.invalidateQueries({ queryKey: ['manager-meetings'] })
    },
    onError: (err) => {
      // O RPC lança uma mensagem específica e segura de mostrar quando o
      // cliente não tem plano definido — mantém em vez de trocar por uma
      // mensagem genérica.
      toast.error(err instanceof Error ? err.message : 'Não foi possível ativar a recorrência de reuniões.')
    },
  })
}

export function useSetMeetingRecurrenceActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientId, active }: { clientId: string; active: boolean }) => {
      const { error } = await supabase.rpc('set_client_meeting_recurrence_active', {
        p_client_id: clientId,
        p_active: active,
      })
      if (error) throw error
    },
    onSuccess: (_data, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['manager-meeting-recurrence', clientId] })
    },
    onError: () => {
      toast.error('Não foi possível atualizar a recorrência de reuniões.')
    },
  })
}

export interface ManagerFileItemRecord {
  id: string
  name: string
  client_id: string
  folder: string | null
  file_url: string | null
  file_type: string | null
  status: string
  created_at: string
}

export function useClientFileItems(clientId: string | null) {
  return useQuery({
    queryKey: ['manager-file-items', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_items')
        .select('*')
        .eq('client_id', clientId as string)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ManagerFileItemRecord[]
    },
    enabled: !!clientId,
  })
}

export interface NewManagerFileItemInput {
  name: string
  client_id: string
  folder: string | null
  file_url: string
  file_type: string | null
}

export function useCreateManagerFileItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewManagerFileItemInput) => {
      const { error } = await supabase.from('file_items').insert(input)
      if (error) throw error
    },
    onSuccess: (_data, { client_id }) => {
      queryClient.invalidateQueries({ queryKey: ['manager-file-items', client_id] })
    },
    onError: () => {
      toast.error('Não foi possível enviar o arquivo.')
    },
  })
}

export interface ManagerApprovalRecord {
  id: string
  title: string
  client_id: string
  file_url: string | null
  file_type: string | null
  status: string
  feedback: string | null
  created_at: string
  auto_approved: boolean
}

export function useClientApprovals(clientId: string | null) {
  return useQuery({
    queryKey: ['manager-approvals', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approvals')
        .select('*')
        .eq('client_id', clientId as string)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ManagerApprovalRecord[]
    },
    enabled: !!clientId,
  })
}

export interface NewManagerApprovalInput {
  title: string
  client_id: string
  file_url: string
  file_type: string | null
}

export function useCreateManagerApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewManagerApprovalInput) => {
      const { error } = await supabase.from('approvals').insert(input)
      if (error) throw error
    },
    onSuccess: (_data, { client_id }) => {
      queryClient.invalidateQueries({ queryKey: ['manager-approvals', client_id] })
    },
    onError: () => {
      toast.error('Não foi possível enviar a aprovação.')
    },
  })
}

/** Última atividade por aba (chave = href do menu), usada pra acender a
 * bolinha de notificação — comparada com "nav_last_seen" em useNavSeen.ts. */
export function useManagerNavActivity(enabled = true) {
  return useQuery({
    queryKey: ['manager-nav-activity'],
    queryFn: async () => {
      const [comments, meetings, fileItems, approvals, alerts, incidents, tasks, smartGoals] = await Promise.all([
        fetchLatestUpdatedAt('comments'),
        fetchLatestUpdatedAt('meetings'),
        fetchLatestUpdatedAt('file_items'),
        fetchLatestUpdatedAt('approvals'),
        fetchLatestUpdatedAt('alerts'),
        fetchLatestUpdatedAt('incidents'),
        fetchLatestUpdatedAt('tasks'),
        fetchLatestUpdatedAt('smart_goals'),
      ])
      return {
        '/client-comments': comments,
        '/client-meetings': meetings,
        '/client-files': latestOf(fileItems, approvals),
        '/incidents': latestOf(alerts, incidents),
        '/kanban': tasks,
        '/smart-goals': smartGoals,
      } as Record<string, string | null>
    },
    enabled,
    refetchInterval: 60000,
  })
}

export interface NewClientInput {
  name: string
  company: string | null
  email: string | null
  status: string
  plan: string | null
  monthly_fee: number | null
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewClientInput) => {
      const { error } = await supabase.from('clients').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-clients'] })
    },
    onError: () => {
      toast.error('Não foi possível criar o cliente.')
    },
  })
}
