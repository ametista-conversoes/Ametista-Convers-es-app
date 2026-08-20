import type { CassieMode } from '@/lib/cassie-modes'
import { supabase } from '@/lib/supabase'

// Cliente da Edge Function da Cassie (Fase 7.1) — chamado direto via
// fetch (não supabase.functions.invoke), mesmo padrão já usado em
// src/lib/integrations.ts. Nome da função no painel do Supabase é
// "CASSIE" (não "cassie") — é só isso que muda aqui.
const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/CASSIE`

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

interface SendCassieMessageParams {
  clientId: string
  message: string
  mode: CassieMode
}

export async function sendCassieMessage({ clientId, message, mode }: SendCassieMessageParams): Promise<string> {
  const res = await fetch(`${FUNCTIONS_BASE}/chat`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, message, mode }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível falar com a Cassie.')
  return body.reply as string
}

interface GeneratePersuasiveCopyParams {
  clientId: string
  connectionId?: string
}

/** Fase 8.4 ("Comunicação Persuasiva") — pede pra Cassie sugerir
 * headlines/textos de anúncio a partir das respostas abertas de
 * Google Forms do cliente. Chamada avulsa (sem histórico salvo), cada
 * clique gera um resultado novo. */
export async function generatePersuasiveCopy({ clientId, connectionId }: GeneratePersuasiveCopyParams): Promise<string> {
  const res = await fetch(`${FUNCTIONS_BASE}/persuasive-copy`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, connection_id: connectionId }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível gerar sugestões.')
  return body.suggestions as string
}
