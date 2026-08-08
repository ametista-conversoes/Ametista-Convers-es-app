import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

/** Quando cada usuário abriu cada aba pela última vez (alimenta a bolinha
 * roxa de notificação no menu — some assim que a aba é visitada). */
export function useNavLastSeen() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['nav-last-seen', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nav_last_seen')
        .select('nav_key, last_seen_at')
        .eq('user_id', user?.id as string)
      if (error) throw error
      return Object.fromEntries((data ?? []).map((row) => [row.nav_key, row.last_seen_at])) as Record<string, string>
    },
    enabled: !!user?.id,
  })
}

function useMarkNavSeenMutation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (navKey: string) => {
      if (!user?.id) return
      const { error } = await supabase
        .from('nav_last_seen')
        .upsert({ user_id: user.id, nav_key: navKey, last_seen_at: new Date().toISOString() })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nav-last-seen', user?.id] })
    },
  })
}

/** Cruza a atividade mais recente de cada aba com a última vez que o
 * usuário a visitou — devolve os hrefs que devem acender a bolinha. */
export function computeUnseenNavHrefs(
  activity: Record<string, string | null> | undefined,
  lastSeen: Record<string, string> | undefined,
): Set<string> {
  const result = new Set<string>()
  if (!activity) return result
  for (const [href, activityAt] of Object.entries(activity)) {
    if (!activityAt) continue
    const seenAt = lastSeen?.[href]
    if (!seenAt || new Date(activityAt) > new Date(seenAt)) {
      result.add(href)
    }
  }
  return result
}

/** Chamar dentro de um `useEffect` de montagem em cada página com bolinha
 * de notificação — marca a aba como vista, apagando a bolinha no menu. */
export function useMarkNavSeen(navKey: string) {
  const { user } = useAuth()
  const mark = useMarkNavSeenMutation()

  useEffect(() => {
    if (!user?.id) return
    mark.mutate(navKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKey, user?.id])
}
