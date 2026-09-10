import { fetchFriendly } from '@/lib/fetch-friendly'
import { supabase } from '@/lib/supabase'

// Cliente da Edge Function "client-access" (Fase 26) — mesmo padrão de
// src/lib/integrations.ts (fetch direto, não supabase.functions.invoke).
const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-access`

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

export interface LinkedClientAccount {
  id: string
  email: string | null
  full_name: string | null
  /** true quando full_name ainda está vazio — a pessoa nunca terminou de
   * aceitar o convite (a tela /reset-password só grava full_name depois
   * de escolher a senha), mesmo que o Supabase já tenha criado a conta. */
  pending: boolean
}

export async function fetchLinkedClientAccounts(clientId: string): Promise<LinkedClientAccount[]> {
  const search = new URLSearchParams({ client_id: clientId })
  const res = await fetchFriendly(`${FUNCTIONS_BASE}/linked?${search.toString()}`, { headers: await authHeaders() })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível buscar as contas vinculadas.')
  return body.accounts as LinkedClientAccount[]
}

/** Vincula uma conta já existente com esse e-mail, ou convida uma nova
 * (Supabase manda o e-mail de convite sozinho) e já vincula em seguida. */
export async function linkClientAccount(clientId: string, email: string): Promise<{ created: boolean }> {
  const res = await fetchFriendly(`${FUNCTIONS_BASE}/link`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, email }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível vincular a conta.')
  return body
}

/** Reenvia o e-mail de convite pra uma conta ainda pendente (nunca
 * terminou de escolher a senha) — o convite original não pode ser
 * reenviado clicando em "Vincular ou convidar" de novo, porque a conta
 * já existe nesse ponto e o /link só revincula sem mandar e-mail. */
export async function resendClientInvite(profileId: string): Promise<void> {
  const res = await fetchFriendly(`${FUNCTIONS_BASE}/resend-invite`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_id: profileId }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível reenviar o convite.')
}

export async function unlinkClientAccount(profileId: string): Promise<void> {
  const res = await fetchFriendly(`${FUNCTIONS_BASE}/unlink`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_id: profileId }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível remover o acesso.')
}
