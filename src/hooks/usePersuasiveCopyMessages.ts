import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sendPersuasiveCopyMessage } from '@/lib/cassie'
import { supabase } from '@/lib/supabase'

export interface PersuasiveCopyMessageRecord {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

/** Chat persistido de "Comunicação Persuasiva" (Fase 8.4b) — mesmo
 * padrão de `useCassieMessages.ts`, só que escopado por cliente +
 * formulário (`connectionId`, null = "todos os formulários") em vez
 * de só por cliente. Guardar no banco (em vez de `useState` local) é
 * o que faz as sugestões sobreviverem a trocar de aba ou recarregar a
 * página. */
export function usePersuasiveCopyMessages(clientId: string, connectionId: string | null) {
  return useQuery({
    queryKey: ['persuasive-copy-messages', clientId, connectionId],
    queryFn: async () => {
      let query = supabase
        .from('persuasive_copy_messages')
        .select('id, role, content, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })
      query = connectionId ? query.eq('connection_id', connectionId) : query.is('connection_id', null)
      const { data, error } = await query
      if (error) throw error
      return data as PersuasiveCopyMessageRecord[]
    },
    enabled: !!clientId,
  })
}

export function useSendPersuasiveCopyMessage(clientId: string, connectionId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = ['persuasive-copy-messages', clientId, connectionId]

  return useMutation({
    mutationKey: ['persuasive-copy-send', clientId, connectionId],
    mutationFn: (message: string) => sendPersuasiveCopyMessage({ clientId, connectionId: connectionId ?? undefined, message }),
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<PersuasiveCopyMessageRecord[]>(queryKey)
      const optimisticMessage: PersuasiveCopyMessageRecord = {
        id: `optimistic-${Date.now()}`,
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData<PersuasiveCopyMessageRecord[]>(queryKey, [...(previous ?? []), optimisticMessage])
      return { previous }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar sugestões.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

// Mesmo motivo de `useCassieSending` — consulta o cache global de
// mutações (não estado local) pra o indicador "pensando" continuar
// certo mesmo se o componente foi desmontado/remontado (troca de aba)
// enquanto o envio ainda estava em andamento.
export function usePersuasiveCopySending(clientId: string, connectionId: string | null) {
  const pending = useMutationState({
    filters: { mutationKey: ['persuasive-copy-send', clientId, connectionId], status: 'pending' },
    select: () => true,
  })
  return pending.length > 0
}
