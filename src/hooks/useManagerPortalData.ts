import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
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
  })
}

export interface UpdateProjectCampaignInput {
  id: string
  icp: string | null
  segmentations: string[]
  objective: string | null
  systems: string | null
  description: string | null
  external_connection_id: string | null
  external_campaign_id: string | null
  external_campaign_name: string | null
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
      projectId: string
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
    mutationFn: async ({ clientId, title, content }: { clientId: string; title: string; content: string }) => {
      const { error } = await supabase.from('comments').insert({
        title,
        content,
        client_id: clientId,
        entity_type: COMMENTS_ENTITY_TYPE,
        entity_id: clientId,
        author_id: user?.id,
        author_name: fullName,
        author_role: role,
      })
      if (error) throw error
    },
    onSuccess: (_data, { clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['manager-comments', clientId] })
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
  })
}

async function fetchLatestUpdatedAt(table: string): Promise<string | null> {
  const { data, error } = await supabase.from(table).select('updated_at').order('updated_at', { ascending: false }).limit(1)
  if (error) throw error
  return (data?.[0] as { updated_at: string } | undefined)?.updated_at ?? null
}

function latestOf(...values: (string | null)[]): string | null {
  const valid = values.filter((v): v is string => !!v)
  if (valid.length === 0) return null
  return valid.reduce((max, v) => (new Date(v) > new Date(max) ? v : max))
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
  })
}
