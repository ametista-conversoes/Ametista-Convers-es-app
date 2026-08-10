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
}

export interface ManagerTaskRecord {
  id: string
  title: string
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

export interface NewAlertInput {
  title: string
  message: string | null
  client_id: string
  severity: string
  category: string | null
}

export function useCreateAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewAlertInput) => {
      const { error } = await supabase.from('alerts').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['manager-timeline'] })
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
        .select('id, title, client_id, status, spend, objective, description')
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

export function useAllTasks() {
  return useQuery({
    queryKey: ['manager-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, client_id, project_id, status, priority, category, due_date, client:clients(name)')
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
    }: {
      clientId: string
      projectId: string
      workflowName: string
      steps: { title: string; category: string }[]
    }) => {
      const { error } = await supabase.rpc('apply_workflow', {
        p_client_id: clientId,
        p_project_id: projectId,
        p_workflow_name: workflowName,
        p_steps: steps,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['manager-timeline'] })
    },
  })
}

export interface WorkflowTemplateStep {
  title: string
  category: string
}

export interface WorkflowTemplateRecord {
  id: string
  name: string
  description: string | null
  steps: WorkflowTemplateStep[]
}

export function useWorkflowTemplates() {
  return useQuery({
    queryKey: ['workflow-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('id, name, description, steps')
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

export interface ManagerOnboardingStepRecord {
  id: string
  title: string
  client_id: string
  project_id: string | null
  completed: boolean
  step_order: number
  category: string | null
  client: { name: string } | null
}

export function useAllOnboardingSteps() {
  return useQuery({
    queryKey: ['manager-onboarding-steps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_steps')
        .select('*, client:clients(name)')
        .order('step_order', { ascending: true })
      if (error) throw error
      return data as unknown as ManagerOnboardingStepRecord[]
    },
  })
}

export interface NewOnboardingStepInput {
  title: string
  client_id: string
  project_id: string | null
  category: string | null
  step_order: number
}

export function useCreateOnboardingStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewOnboardingStepInput) => {
      const { error } = await supabase.from('onboarding_steps').insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-onboarding-steps'] })
    },
  })
}

export function useToggleManagerOnboardingStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ stepId, completed }: { stepId: string; completed: boolean }) => {
      const { error } = await supabase.rpc('toggle_onboarding_step', { step_id: stepId, is_completed: completed })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-onboarding-steps'] })
    },
  })
}

export function useDeleteOnboardingStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase.from('onboarding_steps').delete().eq('id', stepId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-onboarding-steps'] })
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
        '/alerts': alerts,
        '/incidents': incidents,
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
