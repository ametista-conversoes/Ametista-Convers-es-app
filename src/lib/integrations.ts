import { supabase } from '@/lib/supabase'

// Cliente da Edge Function "integrations" (Fase 6.1/6.2) — chamado
// direto via fetch (não supabase.functions.invoke) porque as rotas
// usam GET com query string, e assim fica igual ao que já foi testado
// manualmente durante o desenvolvimento.
const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/integrations`

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

export interface ConnectIntegrationParams {
  provider: 'google_ads' | 'google_forms' | 'meta_ads'
  digitalAssetId: string
  formId?: string
}

/** Chama /connect e devolve a URL de autorização do Google — quem
 * chama essa função é responsável por mandar o navegador pra lá
 * (`window.location.href = url`). */
export async function connectIntegration(params: ConnectIntegrationParams): Promise<string> {
  const search = new URLSearchParams({ provider: params.provider, digital_asset_id: params.digitalAssetId })
  if (params.formId) search.set('form_id', params.formId)

  const res = await fetch(`${FUNCTIONS_BASE}/connect?${search.toString()}`, { headers: await authHeaders() })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível iniciar a conexão.')
  return body.authorizationUrl as string
}

export interface SyncIntegrationResult {
  syncedDays?: number
  syncedQuestions?: number
  syncedResponses?: number
}

export async function syncIntegration(connectionId: string): Promise<SyncIntegrationResult> {
  const res = await fetch(`${FUNCTIONS_BASE}/sync`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ connection_id: connectionId }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível sincronizar.')
  return body
}

export interface GoogleAdsAccount {
  id: string
  name: string | null
  loginCustomerId: string
}

/** Lista as contas de anúncio reais do Google Ads que uma conexão
 * enxerga (Fase 20) — nunca inclui conta gerenciadora/MCC, só usada
 * quando `handleCallback` não conseguiu escolher sozinho (0 ou mais de
 * 1 conta encontrada). */
export async function listGoogleAdsAccounts(connectionId: string): Promise<GoogleAdsAccount[]> {
  const search = new URLSearchParams({ connection_id: connectionId })
  const res = await fetch(`${FUNCTIONS_BASE}/accounts?${search.toString()}`, { headers: await authHeaders() })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível buscar as contas de anúncios.')
  return body.accounts as GoogleAdsAccount[]
}

/** Grava qual conta de anúncios do Google Ads usar numa conexão, depois
 * de escolhida numa lista (Fase 20). */
export async function selectGoogleAdsAccount(connectionId: string, account: GoogleAdsAccount): Promise<void> {
  const res = await fetch(`${FUNCTIONS_BASE}/select-account`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ connection_id: connectionId, customer_id: account.id, login_customer_id: account.loginCustomerId }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível salvar a conta escolhida.')
}

export interface ExternalCampaign {
  id: string
  name: string
  status: string
}

/** Lista as campanhas reais de uma conta já conectada (Fase 8.1b —
 * vincular um projeto a uma campanha específica do Meta/Google Ads). */
export async function listCampaigns(connectionId: string): Promise<ExternalCampaign[]> {
  const search = new URLSearchParams({ connection_id: connectionId })
  const res = await fetch(`${FUNCTIONS_BASE}/campaigns?${search.toString()}`, { headers: await authHeaders() })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível buscar as campanhas.')
  return body.campaigns as ExternalCampaign[]
}
