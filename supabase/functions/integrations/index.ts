// Ametista Conversões — Fase 6.1: fundação do backend de integrações.
//
// Como usar: cole este arquivo inteiro no painel do Supabase em
// "Edge Functions" > "New Function" (nome da função: "integrations")
// e clique em "Deploy".
//
// Rotas (identificadas pelo final do path da requisição):
//   GET .../integrations/connect?provider=google_ads&digital_asset_id=...
//   GET .../integrations/callback?state=...&code=...
//
// Nesta sub-fase nenhum provedor real está configurado ainda (isso é
// a Fase 6.2/6.3) — "/connect" já devolve uma URL de autorização
// testável (com os client IDs ainda vazios), e "/callback" já grava
// um token criptografado de teste, provando que a estrutura genérica
// funciona de ponta a ponta antes de ligar ao Google/Meta de verdade.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const PROVIDERS = ['google_ads', 'google_forms', 'meta_ads'] as const
type Provider = (typeof PROVIDERS)[number]

const OAUTH_CLIENT_ENV: Record<Provider, string> = {
  google_ads: 'GOOGLE_OAUTH_CLIENT_ID',
  google_forms: 'GOOGLE_OAUTH_CLIENT_ID',
  meta_ads: 'META_APP_ID',
}

const OAUTH_AUTHORIZE_URL: Record<Provider, string> = {
  google_ads: 'https://accounts.google.com/o/oauth2/v2/auth',
  google_forms: 'https://accounts.google.com/o/oauth2/v2/auth',
  meta_ads: 'https://www.facebook.com/v19.0/dialog/oauth',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isProvider(value: string | null): value is Provider {
  return !!value && (PROVIDERS as readonly string[]).includes(value)
}

function getServiceClient() {
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
}

async function handleConnect(url: URL) {
  const provider = url.searchParams.get('provider')
  const digitalAssetId = url.searchParams.get('digital_asset_id')

  if (!isProvider(provider)) {
    return jsonResponse({ error: `Provedor inválido. Use um de: ${PROVIDERS.join(', ')}` }, 400)
  }
  if (!digitalAssetId) {
    return jsonResponse({ error: 'digital_asset_id é obrigatório' }, 400)
  }

  const supabase = getServiceClient()

  const { data: asset, error: assetError } = await supabase
    .from('digital_assets')
    .select('id')
    .eq('id', digitalAssetId)
    .maybeSingle()
  if (assetError) return jsonResponse({ error: assetError.message }, 500)
  if (!asset) return jsonResponse({ error: 'Ativo digital não encontrado' }, 404)

  // Reaproveita a conexão existente se já houver uma pra esse ativo +
  // provedor, senão cria uma nova (sempre começa "disconnected").
  const { data: connection, error: connectionError } = await supabase
    .from('digital_asset_connections')
    .upsert(
      { digital_asset_id: digitalAssetId, provider, status: 'disconnected' },
      { onConflict: 'digital_asset_id,provider', ignoreDuplicates: false },
    )
    .select('id')
    .single()
  if (connectionError) return jsonResponse({ error: connectionError.message }, 500)

  const clientId = Deno.env.get(OAUTH_CLIENT_ENV[provider]) ?? ''
  // Monta a URL de callback a partir do caminho da própria requisição
  // (troca só o final "/connect" por "/callback"), combinado com
  // SUPABASE_URL — o "origin" visto de dentro da função é um endereço
  // interno (não o público), então não dá pra usar direto; já o path
  // relativo reflete o nome/slug real da função publicada.
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1${url.pathname.replace(/\/connect$/, '/callback')}`
  const state = connection.id

  const authorizationUrl = new URL(OAUTH_AUTHORIZE_URL[provider])
  authorizationUrl.searchParams.set('client_id', clientId)
  authorizationUrl.searchParams.set('redirect_uri', redirectUri)
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('state', state)
  if (!clientId) {
    authorizationUrl.searchParams.set('client_id_pendente', 'configure o segredo ' + OAUTH_CLIENT_ENV[provider])
  }

  return jsonResponse({ authorizationUrl: authorizationUrl.toString(), connectionId: connection.id })
}

async function handleCallback(url: URL) {
  const state = url.searchParams.get('state')
  const code = url.searchParams.get('code')

  if (!state) return jsonResponse({ error: 'state é obrigatório' }, 400)

  const supabase = getServiceClient()

  const { data: connection, error: connectionError } = await supabase
    .from('digital_asset_connections')
    .select('id, provider')
    .eq('id', state)
    .maybeSingle()
  if (connectionError) return jsonResponse({ error: connectionError.message }, 500)
  if (!connection) return jsonResponse({ error: 'Conexão não encontrada (state inválido)' }, 404)

  // A troca de verdade do "code" por token com o provedor entra na
  // Fase 6.2/6.3 — por enquanto grava um token de teste no Vault, só
  // pra provar que o caminho genérico (banco + segredo criptografado)
  // funciona. "oauth_tokens" só guarda o id do segredo, nunca o valor.
  const fakeAccessToken = code ? `test-access-token-for-${code}` : 'test-access-token'

  const { data: secretId, error: secretError } = await supabase.rpc('store_oauth_secret', {
    secret: fakeAccessToken,
  })
  if (secretError) return jsonResponse({ error: secretError.message }, 500)

  const { error: tokenError } = await supabase
    .from('oauth_tokens')
    .upsert({ connection_id: connection.id, access_token_secret_id: secretId }, { onConflict: 'connection_id' })
  if (tokenError) return jsonResponse({ error: tokenError.message }, 500)

  const { error: statusError } = await supabase
    .from('digital_asset_connections')
    .update({ status: 'connected' })
    .eq('id', connection.id)
  if (statusError) return jsonResponse({ error: statusError.message }, 500)

  return jsonResponse({ ok: true, connectionId: connection.id, provider: connection.provider, status: 'connected' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)

  try {
    if (url.pathname.endsWith('/connect')) {
      return await handleConnect(url)
    }
    if (url.pathname.endsWith('/callback')) {
      return await handleCallback(url)
    }
    return jsonResponse({ error: 'Rota não encontrada. Use /connect ou /callback.' }, 404)
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Erro inesperado' }, 500)
  }
})
