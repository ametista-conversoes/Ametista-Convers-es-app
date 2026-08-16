import { supabase } from '@/lib/supabase'

// Cliente da Edge Function "cassie" (Fase 7.1) — chamado direto via
// fetch (não supabase.functions.invoke), mesmo padrão já usado em
// src/lib/integrations.ts.
const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cassie`

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

export async function sendCassieMessage(message: string): Promise<string> {
  const res = await fetch(`${FUNCTIONS_BASE}/chat`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível falar com a Cassie.')
  return body.reply as string
}
