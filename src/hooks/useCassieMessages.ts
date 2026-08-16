import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { sendCassieMessage } from '@/lib/cassie'
import { supabase } from '@/lib/supabase'

export interface CassieMessageRecord {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export function useCassieMessages() {
  const { clientId } = useAuth()
  return useQuery({
    queryKey: ['cassie-messages', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cassie_messages')
        .select('id, role, content, created_at')
        .eq('client_id', clientId as string)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as CassieMessageRecord[]
    },
    enabled: !!clientId,
  })
}

export function useSendCassieMessage() {
  const { clientId } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendCassieMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cassie-messages', clientId] })
    },
  })
}
