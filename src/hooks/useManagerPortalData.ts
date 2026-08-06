import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useAllIncidents() {
  return useQuery({
    queryKey: ['manager-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*, client:clients(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as ManagerIncidentRecord[]
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

export function useAllAlerts() {
  return useQuery({
    queryKey: ['manager-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, client:clients(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as ManagerAlertRecord[]
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
      const { data, error } = await supabase.from('projects').select('id, title, client_id, status, spend')
      if (error) throw error
      return data as ManagerProjectRecord[]
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

export interface NewManagerTaskInput {
  title: string
  client_id: string
  project_id: string | null
  category: string | null
  priority: string
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
