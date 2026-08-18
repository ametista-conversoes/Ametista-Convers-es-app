import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { sendCassieMessage } from '@/lib/cassie'
import type { CassieMode } from '@/lib/cassie-modes'
import { supabase } from '@/lib/supabase'

export interface CassieMessageRecord {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode: CassieMode
  created_at: string
}

export function useCassieMessages(clientId: string) {
  return useQuery({
    queryKey: ['cassie-messages', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cassie_messages')
        .select('id, role, content, mode, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as CassieMessageRecord[]
    },
    enabled: !!clientId,
  })
}

export function useSendCassieMessage(clientId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['cassie-messages', clientId]

  return useMutation({
    mutationKey: ['cassie-send', clientId],
    mutationFn: ({ message, mode }: { message: string; mode: CassieMode }) => sendCassieMessage({ clientId, message, mode }),
    onMutate: async ({ message, mode }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CassieMessageRecord[]>(queryKey)
      const optimisticMessage: CassieMessageRecord = {
        id: `optimistic-${Date.now()}`,
        role: 'user',
        content: message,
        mode,
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData<CassieMessageRecord[]>(queryKey, [...(previous ?? []), optimisticMessage])
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      toast.error(err instanceof Error ? err.message : 'Não foi possível falar com a Cassie.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

// Consulta o cache global de mutações (não o estado local do hook acima)
// para que o indicador "pensando" continue certo mesmo se a página foi
// desmontada e remontada enquanto o envio ainda estava em andamento.
export function useCassieSending(clientId: string) {
  const pending = useMutationState({
    filters: { mutationKey: ['cassie-send', clientId], status: 'pending' },
    select: () => true,
  })
  return pending.length > 0
}

export function useClearCassieHistory(clientId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['cassie-messages', clientId]

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('cassie_messages')
        .delete()
        .eq('client_id', clientId)
        .eq('conversation_owner_id', user?.id as string)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.setQueryData<CassieMessageRecord[]>(queryKey, [])
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
