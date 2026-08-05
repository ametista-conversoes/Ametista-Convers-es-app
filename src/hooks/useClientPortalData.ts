import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface ClientRecord {
  id: string
  name: string
  company: string | null
  email: string | null
  status: string
  plan: string | null
  monthly_fee: number | null
  health_score: number | null
  health_performance: number | null
  health_financial: number | null
  health_delivery: number | null
  health_relationship: number | null
}

export interface ProjectRecord {
  id: string
  title: string
  status: string
  health_score: number | null
  cpa: number | null
  roas: number | null
  ctr: number | null
  spend: number | null
  revenue: number | null
  channel: string | null
  start_date: string | null
  end_date: string | null
  objective: string | null
  icp: string | null
  segment: string | null
}

export interface TaskRecord {
  id: string
  title: string
  description: string | null
  project_id: string | null
  status: string
  priority: string
  due_date: string | null
  category: string | null
}

export interface MeetingRecord {
  id: string
  title: string
  date: string | null
  meeting_link: string | null
  status: string
}

export interface SmartGoalRecord {
  id: string
  title: string
  metric_type: string | null
  target_value: number | null
  current_value: number | null
  period: string | null
  status: string
}

export interface AlertRecord {
  id: string
  title: string
  message: string | null
  severity: string
  category: string | null
  resolved: boolean
  created_at: string
}

export interface CommentRecord {
  id: string
  title: string | null
  content: string
  author_id: string | null
  author_name: string | null
  author_role: string | null
  created_at: string
}

export interface FileItemRecord {
  id: string
  name: string
  folder: string | null
  file_url: string | null
  file_type: string | null
  status: string
  created_at: string
}

export interface ApprovalRecord {
  id: string
  title: string
  file_url: string | null
  file_type: string | null
  status: string
  feedback: string | null
  created_at: string
}

export interface OnboardingStepRecord {
  id: string
  title: string
  project_id: string | null
  completed: boolean
  step_order: number
  category: string | null
}

export interface PerformanceSnapshotRecord {
  id: string
  project_id: string
  snapshot_date: string
  spend: number | null
  revenue: number | null
  roas: number | null
  ctr: number | null
}

export function useClient() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', clientId as string).single()
      if (error) throw error
      return data as ClientRecord
    },
    enabled: !!clientId,
  })
}

export function useProjects() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['projects', clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').eq('client_id', clientId as string)
      if (error) throw error
      return data as ProjectRecord[]
    },
    enabled: !!clientId,
  })
}

export function useTasks() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['tasks', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', clientId as string)
        .order('due_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as TaskRecord[]
    },
    enabled: !!clientId,
  })
}

export function useUpcomingMeetings() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['meetings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('client_id', clientId as string)
        .order('date', { ascending: true })
      if (error) throw error
      return data as MeetingRecord[]
    },
    enabled: !!clientId,
  })
}

export function useSmartGoals() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['smart-goals', clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from('smart_goals').select('*').eq('client_id', clientId as string)
      if (error) throw error
      return data as SmartGoalRecord[]
    },
    enabled: !!clientId,
  })
}

export function useAlerts() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['alerts', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('client_id', clientId as string)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as AlertRecord[]
    },
    enabled: !!clientId,
  })
}

export function useOnboardingSteps() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['onboarding-steps', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_steps')
        .select('*')
        .eq('client_id', clientId as string)
        .order('step_order', { ascending: true })
      if (error) throw error
      return data as OnboardingStepRecord[]
    },
    enabled: !!clientId,
  })
}

export function useToggleOnboardingStep() {
  const { clientId } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ stepId, completed }: { stepId: string; completed: boolean }) => {
      const { error } = await supabase.rpc('toggle_onboarding_step', { step_id: stepId, is_completed: completed })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps', clientId] })
    },
  })
}

export function usePerformanceSnapshots() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['performance-snapshots', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_snapshots')
        .select('*')
        .eq('client_id', clientId as string)
        .order('snapshot_date', { ascending: true })
      if (error) throw error
      return data as PerformanceSnapshotRecord[]
    },
    enabled: !!clientId,
  })
}

export interface NewTaskInput {
  title: string
  description: string | null
  category: string | null
  due_date: string | null
  priority: string
}

export function useCreateTask() {
  const { clientId } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewTaskInput) => {
      const { error } = await supabase.from('tasks').insert({ ...input, client_id: clientId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', clientId] })
    },
  })
}

export function useSetTaskDone() {
  const { clientId } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, done }: { taskId: string; done: boolean }) => {
      const { error } = await supabase.rpc('set_task_done', { task_id: taskId, is_done: done })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', clientId] })
    },
  })
}

const COMMENTS_ENTITY_TYPE = 'general'

export function useComments() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['comments', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('client_id', clientId as string)
        .eq('entity_type', COMMENTS_ENTITY_TYPE)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as CommentRecord[]
    },
    enabled: !!clientId,
  })
}

export function useCreateComment() {
  const { clientId, user, fullName, role } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', clientId] })
    },
  })
}

export interface NewMeetingInput {
  title: string
  date: string
  meeting_link: string | null
}

export function useCreateMeeting() {
  const { clientId } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewMeetingInput) => {
      const { error } = await supabase.from('meetings').insert({ ...input, client_id: clientId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', clientId] })
    },
  })
}

export function useFileItems() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['file-items', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_items')
        .select('*')
        .eq('client_id', clientId as string)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as FileItemRecord[]
    },
    enabled: !!clientId,
  })
}

export interface NewFileItemInput {
  name: string
  folder: string | null
  file_url: string
  file_type: string | null
}

export function useCreateFileItem() {
  const { clientId } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewFileItemInput) => {
      const { error } = await supabase.from('file_items').insert({ ...input, client_id: clientId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-items', clientId] })
    },
  })
}

export function useApprovals() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['approvals', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approvals')
        .select('*')
        .eq('client_id', clientId as string)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ApprovalRecord[]
    },
    enabled: !!clientId,
  })
}

export function useRespondToApproval() {
  const { clientId } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      approvalId,
      status,
      feedback,
    }: {
      approvalId: string
      status: 'approved' | 'rejected' | 'revision_requested'
      feedback: string | null
    }) => {
      const { error } = await supabase.rpc('respond_to_approval', {
        approval_id: approvalId,
        new_status: status,
        feedback_text: feedback,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals', clientId] })
    },
  })
}
