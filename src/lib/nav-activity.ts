import { supabase } from '@/lib/supabase'

/** Data de atualização mais recente de uma tabela — usada pra acender a
 * bolinha de notificação do menu. Sem `clientId`, olha a tabela inteira
 * (Portal Gestor, que vê todos os clientes); com `clientId`, filtra só
 * os registros daquele cliente (Portal Cliente). */
export async function fetchLatestUpdatedAt(table: string, clientId?: string): Promise<string | null> {
  let query = supabase.from(table).select('updated_at').order('updated_at', { ascending: false }).limit(1)
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw error
  return (data?.[0] as { updated_at: string } | undefined)?.updated_at ?? null
}

/** Mais recente entre várias datas (ou `null`, quando nulos) — usada
 * pra combinar 2 tabelas numa mesma aba do menu (ex: arquivos +
 * aprovações, ambas na aba "Arquivos"). */
export function latestOf(...values: (string | null)[]): string | null {
  const valid = values.filter((v): v is string => !!v)
  if (valid.length === 0) return null
  return valid.reduce((max, v) => (new Date(v) > new Date(max) ? v : max))
}
