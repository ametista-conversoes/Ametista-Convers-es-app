import { useQuery } from '@tanstack/react-query'
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
}

export interface TaskRecord {
  id: string
  title: string
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
