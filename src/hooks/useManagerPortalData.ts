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
}

export interface ManagerProjectRecord {
  id: string
  client_id: string
  status: string
  spend: number | null
}

export interface ManagerTaskRecord {
  id: string
  status: string
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
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ManagerIncidentRecord[]
    },
  })
}

export function useAllProjects() {
  return useQuery({
    queryKey: ['manager-projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, client_id, status, spend')
      if (error) throw error
      return data as ManagerProjectRecord[]
    },
  })
}

export function useAllTasks() {
  return useQuery({
    queryKey: ['manager-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('id, status')
      if (error) throw error
      return data as ManagerTaskRecord[]
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
