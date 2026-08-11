import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export interface AvailabilityBlockRecord {
  id: string
  weekday: number
  time_slot: string
}

/** Horários que o gestor marcou como indisponíveis (Fase 6.5.1) —
 * leitura liberada pra qualquer papel autenticado, porque o cliente
 * precisa disso pra filtrar os horários na hora de pedir uma reunião
 * de emergência (ver EmergencyMeetingDialog.tsx). */
export function useAvailabilityBlocks() {
  return useQuery({
    queryKey: ['manager-availability-blocks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('manager_availability_blocks').select('id, weekday, time_slot')
      if (error) throw error
      return data as AvailabilityBlockRecord[]
    },
  })
}

/** Alterna um horário entre bloqueado/disponível — só admin/gestor
 * (RLS garante isso do lado do banco também). */
export function useToggleAvailabilityBlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ weekday, timeSlot, blocked }: { weekday: number; timeSlot: string; blocked: boolean }) => {
      if (blocked) {
        const { error } = await supabase.from('manager_availability_blocks').insert({ weekday, time_slot: timeSlot })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('manager_availability_blocks')
          .delete()
          .eq('weekday', weekday)
          .eq('time_slot', timeSlot)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-availability-blocks'] })
    },
    onError: () => {
      // A grade dispara vários toggles seguidos durante um arrasto
      // (ver AvailabilitySettingsTab.tsx), sem aguardar cada um — por
      // isso o aviso de erro mora aqui, não em quem chama.
      toast.error('Não foi possível salvar uma das mudanças de disponibilidade.')
      queryClient.invalidateQueries({ queryKey: ['manager-availability-blocks'] })
    },
  })
}
