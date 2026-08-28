// Ametista Conversões — Fase 6.1-6.3: backend de integrações (Google
// Ads, Google Forms, Meta Ads).
//
// Como usar: cole este arquivo inteiro no painel do Supabase, em
// Edge Functions > "integrations" > editar código > Deploy. Essa
// função recebe chamadas de fora do Supabase (o navegador da pessoa
// durante o login do Google/Meta, e o gatilho do Google Forms), então
// a verificação automática de JWT precisa estar DESLIGADA nas
// configurações da função — a autenticação é feita na mão dentro do
// código, rota por rota (ver `requireAdminOrGestor`, o parâmetro
// `state` do OAuth, e o segredo `X-Webhook-Secret`).
//
// Segredos que essa função espera encontrar configurados (Edge
// Functions > integrations > Secrets), além dos quatro que o Supabase
// já injeta sozinho em toda função (SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL). Os 3 do Google foram
// criados no painel com nomes diferentes do padrão (o painel não deixa
// renomear depois de criado — mesmo caso já resolvido assim pra Cassie
// na Fase 7.1) — os nomes REAIS usados no código são os que aparecem
// entre parênteses, ver `GOOGLE_OAUTH_CLIENT_ID_ENV` etc. logo abaixo:
//   GOOGLE_OAUTH_CLIENT_ID       (real: "client ID")       — do Google Cloud Console
//   GOOGLE_OAUTH_CLIENT_SECRET   (real: "Client secret")   — do Google Cloud Console
//   GOOGLE_ADS_DEVELOPER_TOKEN   (real: "Developer token") — do Google Ads Manager Account
//   META_APP_ID                  — do app em developers.facebook.com
//   META_APP_SECRET              — do app em developers.facebook.com
//   FORMS_WEBHOOK_SECRET         — inventado por você, usado também no
//                                   script do Apps Script (ver
//                                   forms-trigger.gs.txt)
//   CRON_SECRET                  — inventado por você, usado também na
//                                   migração migration-019-fase64-cron.sql
//                                   (job agendado que chama /sync-all)
//   FRONTEND_URL                 — ex: http://localhost:5173 (sem
//                                   barra no final)
//
// Rotas (identificadas pelo final do path da requisição):
//   GET  .../integrations/connect?provider=google_ads&digital_asset_id=...
//   GET  .../integrations/connect?provider=google_forms&digital_asset_id=...&form_id=...
//   GET  .../integrations/connect?provider=meta_ads&digital_asset_id=...
//   GET  .../integrations/callback?state=...&code=...          (aberta pelo Google/Meta)
//   GET  .../integrations/campaigns?connection_id=...           (vincular projeto a uma campanha — Fase 8.1b)
//   POST .../integrations/sync            { connection_id }     (botão "Sincronizar agora" — Google
//                                          Ads/Meta Ads sincroniza métricas; Google Forms sincroniza
//                                          perguntas+respostas estruturadas via forms.googleapis.com,
//                                          Fase 8.2)
//   POST .../integrations/sync-all        {}                    (cabeçalho X-Cron-Secret,
//                                          chamada pelo job agendado — Fase 6.4, agora também
//                                          sincroniza conexões de Google Forms)
//   POST .../integrations/forms-webhook   { formId, responseId, submittedAt, answers }
//                                          (cabeçalho X-Webhook-Secret — continua só criando o
//                                          Alerta genérico de "nova resposta", sem mudança)

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'

const PROVIDERS = ['google_ads', 'google_forms', 'meta_ads'] as const
type Provider = (typeof PROVIDERS)[number]

const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ADS_API_VERSION = 'v17' // conferir se ainda é a versão suportada quando for testar de verdade — a Google descontinua versões antigas com o tempo

// Nomes REAIS dos secrets no painel do Supabase (Fase 8.2b) — o
// usuário já tinha criado os 3 com esses nomes antes de eu documentar
// o padrão GOOGLE_OAUTH_CLIENT_ID/GOOGLE_OAUTH_CLIENT_SECRET/
// GOOGLE_ADS_DEVELOPER_TOKEN, e o painel não deixa renomear um secret
// depois de criado — então o código lê pelos nomes que existem de
// verdade, em vez de pedir pra recriar tudo (mesma solução já usada
// pra Cassie na Fase 7.1, com Openai_api_key).
const GOOGLE_OAUTH_CLIENT_ID_ENV = 'client ID'
const GOOGLE_OAUTH_CLIENT_SECRET_ENV = 'Client secret'
const GOOGLE_ADS_DEVELOPER_TOKEN_ENV = 'Developer token'

const GOOGLE_SCOPES: Record<'google_ads' | 'google_forms', string> = {
  google_ads: 'https://www.googleapis.com/auth/adwords',
  google_forms: 'https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/forms.responses.readonly',
}

const META_GRAPH_API_VERSION = 'v19.0' // conferir se ainda é suportada quando for testar de verdade
const META_AUTHORIZE_URL = `https://www.facebook.com/${META_GRAPH_API_VERSION}/dialog/oauth`
const META_TOKEN_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/oauth/access_token`
const META_SCOPE = 'ads_read' // só leitura de métricas — nada de gerenciar campanha

// API oficial do Google Forms (Fase 8.2) — precisa estar habilitada no
// mesmo projeto do Google Cloud Console usado pro OAuth, além dos
// escopos forms.body.readonly/forms.responses.readonly já pedidos
// desde a Fase 6.2 (que até aqui nunca eram usados de verdade).
const GOOGLE_FORMS_API_BASE = 'https://forms.googleapis.com/v1/forms'

// Restrito ao domínio de produção (deploy na Vercel) — antes era '*'
// (qualquer site podia chamar), trocado ao publicar o app de verdade.
// Não afeta /callback (redirect direto do Google/Meta, não é chamada
// de navegador sujeita a CORS) nem /forms-webhook (chamada servidor-a-
// servidor do Google Apps Script, também não passa por CORS).
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ametistaconversoesapp.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Manda o navegador de volta pro app depois do login do Google/Meta —
 * via redirect HTTP de verdade (302), não uma página HTML. Rotas de
 * Edge Function chamadas sem autenticação (como /callback, aberta pelo
 * navegador vindo do Google, sem login nosso por trás) têm o
 * Content-Type da resposta forçado pra text/plain pelo próprio
 * Supabase — uma página aqui nunca renderiza bonita, sempre aparece
 * como código cru. O resultado vai na query string; quem mostra um
 * aviso de verdade é o próprio app (toast em Assets.tsx). */
function callbackRedirect(success: boolean, message: string) {
  const frontendUrl = Deno.env.get('FRONTEND_URL') ?? 'http://localhost:5173'
  const target = new URL(`${frontendUrl}/assets`)
  target.searchParams.set('integration', success ? 'connected' : 'error')
  target.searchParams.set('message', message)
  return new Response(null, { status: 302, headers: { ...corsHeaders, Location: target.toString() } })
}

function isProvider(value: string | null): value is Provider {
  return !!value && (PROVIDERS as readonly string[]).includes(value)
}

/** Aceita tanto o id puro de um Google Forms quanto o link inteiro
 * (ex: https://docs.google.com/forms/d/<id>/edit). */
function extractFormId(input: string): string {
  const match = input.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : input.trim()
}

function getServiceClient() {
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
}

/** Compara em tempo constante (Fase 20.1) — evita que alguém descubra
 * um segredo (X-Cron-Secret/X-Webhook-Secret) aos poucos, medindo
 * quanto tempo cada tentativa errada leva pra falhar. */
function safeCompare(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a)
  const bufB = new TextEncoder().encode(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

// Fase 20.1: nunca devolver error.message bruto (Postgres/Google/Meta)
// pro navegador — loga o erro completo no servidor (visível em Edge
// Functions > Logs no painel do Supabase) e devolve só uma mensagem
// genérica pro cliente.
function dbErrorResponse(context: string, error: { message: string }) {
  console.error(`[integrations] ${context}:`, error)
  return jsonResponse({ error: 'Erro ao acessar o banco de dados. Tente novamente.' }, 500)
}

function platformErrorResponse(context: string, platform: string, body: unknown) {
  console.error(`[integrations] ${context} — erro da ${platform}:`, body)
  return jsonResponse({ error: `Erro ao consultar a ${platform}. Tente novamente.` }, 502)
}

function dbErrorRedirect(context: string, error: { message: string }) {
  console.error(`[integrations] ${context}:`, error)
  return callbackRedirect(false, 'Erro ao acessar o banco de dados. Tente novamente.')
}

function platformErrorRedirect(context: string, platform: string, body: unknown) {
  console.error(`[integrations] ${context} — erro da ${platform}:`, body)
  return callbackRedirect(false, `Não foi possível conectar com o ${platform}. Tente novamente.`)
}

function dbSyncError(context: string, error: { message: string }): { ok: false; error: string } {
  console.error(`[integrations] ${context}:`, error)
  return { ok: false, error: 'Erro ao acessar o banco de dados. Tente novamente.' }
}

function platformSyncError(context: string, platform: string, body: unknown): { ok: false; error: string } {
  console.error(`[integrations] ${context} — erro da ${platform}:`, body)
  return { ok: false, error: `Erro ao consultar a ${platform}. Tente novamente.` }
}

/** Só usado nas rotas chamadas pelo nosso próprio front-end (/connect,
 * /sync) — /callback e /forms-webhook são chamadas por fora (Google) e
 * se autenticam de outro jeito (ver comentário no topo do arquivo). */
async function requireAdminOrGestor(req: Request): Promise<{ userId: string; role: string } | Response> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return jsonResponse({ error: 'Não autenticado' }, 401)

  const anonClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '')
  const { data: userData, error: userError } = await anonClient.auth.getUser(token)
  if (userError || !userData.user) return jsonResponse({ error: 'Sessão inválida' }, 401)

  const supabase = getServiceClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  if (profileError || !profile) return jsonResponse({ error: 'Perfil não encontrado' }, 403)
  if (profile.role !== 'admin' && profile.role !== 'gestor') {
    return jsonResponse({ error: 'Não autorizado' }, 403)
  }
  return { userId: userData.user.id, role: profile.role }
}

async function handleConnect(req: Request, url: URL) {
  const auth = await requireAdminOrGestor(req)
  if (auth instanceof Response) return auth

  const provider = url.searchParams.get('provider')
  const digitalAssetId = url.searchParams.get('digital_asset_id')

  if (!isProvider(provider)) {
    return jsonResponse({ error: `Provedor inválido. Use um de: ${PROVIDERS.join(', ')}` }, 400)
  }
  if (!digitalAssetId) {
    return jsonResponse({ error: 'digital_asset_id é obrigatório' }, 400)
  }

  const formIdInput = url.searchParams.get('form_id')

  if (provider === 'google_forms' && !formIdInput) {
    return jsonResponse({ error: 'Informe o id ou o link do formulário' }, 400)
  }

  // Falha aqui dentro, com uma mensagem clara, em vez de mandar a
  // pessoa pro Google/Meta com um link quebrado (os dois recusam um
  // "client_id" vazio com um erro genérico, sem nem mostrar login).
  if (provider !== 'meta_ads' && !Deno.env.get(GOOGLE_OAUTH_CLIENT_ID_ENV)) {
    return jsonResponse(
      { error: `As credenciais do Google ainda não foram configuradas nesta função (falta o segredo "${GOOGLE_OAUTH_CLIENT_ID_ENV}").` },
      400,
    )
  }
  if (provider === 'meta_ads' && !Deno.env.get('META_APP_ID')) {
    return jsonResponse(
      { error: 'As credenciais do Meta ainda não foram configuradas nesta função (falta o segredo META_APP_ID).' },
      400,
    )
  }

  const supabase = getServiceClient()

  const { data: asset, error: assetError } = await supabase
    .from('digital_assets')
    .select('id')
    .eq('id', digitalAssetId)
    .maybeSingle()
  if (assetError) return dbErrorResponse('handleConnect: buscar ativo digital', assetError)
  if (!asset) return jsonResponse({ error: 'Ativo digital não encontrado' }, 404)

  const upsertPayload: Record<string, unknown> = { digital_asset_id: digitalAssetId, provider, status: 'disconnected' }
  if (provider === 'google_forms') upsertPayload.external_account_id = extractFormId(formIdInput as string)

  const { data: connection, error: connectionError } = await supabase
    .from('digital_asset_connections')
    .upsert(upsertPayload, { onConflict: 'digital_asset_id,provider', ignoreDuplicates: false })
    .select('id')
    .single()
  if (connectionError) return dbErrorResponse('handleConnect: upsert conexão', connectionError)

  // Monta a URL de callback a partir do caminho da própria requisição
  // (troca só o final "/connect" por "/callback") combinado com
  // SUPABASE_URL — o "origin" visto de dentro da função é um endereço
  // interno, não o público.
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1${url.pathname.replace(/\/connect$/, '/callback')}`

  let authorizationUrl: URL
  if (provider === 'meta_ads') {
    authorizationUrl = new URL(META_AUTHORIZE_URL)
    authorizationUrl.searchParams.set('client_id', Deno.env.get('META_APP_ID') ?? '')
    authorizationUrl.searchParams.set('redirect_uri', redirectUri)
    authorizationUrl.searchParams.set('response_type', 'code')
    authorizationUrl.searchParams.set('scope', META_SCOPE)
    authorizationUrl.searchParams.set('state', connection.id)
  } else {
    authorizationUrl = new URL(GOOGLE_AUTHORIZE_URL)
    authorizationUrl.searchParams.set('client_id', Deno.env.get(GOOGLE_OAUTH_CLIENT_ID_ENV) ?? '')
    authorizationUrl.searchParams.set('redirect_uri', redirectUri)
    authorizationUrl.searchParams.set('response_type', 'code')
    authorizationUrl.searchParams.set('access_type', 'offline')
    authorizationUrl.searchParams.set('prompt', 'consent')
    authorizationUrl.searchParams.set('scope', GOOGLE_SCOPES[provider])
    authorizationUrl.searchParams.set('state', connection.id)
  }

  return jsonResponse({ authorizationUrl: authorizationUrl.toString(), connectionId: connection.id })
}

async function handleCallback(url: URL) {
  const state = url.searchParams.get('state')
  const code = url.searchParams.get('code')
  const oauthError = url.searchParams.get('error')

  if (!state) return callbackRedirect(false, 'Parâmetro "state" ausente.')

  const supabase = getServiceClient()

  const { data: connection, error: connectionError } = await supabase
    .from('digital_asset_connections')
    .select('id, provider')
    .eq('id', state)
    .maybeSingle()
  if (connectionError) return dbErrorRedirect('handleCallback: buscar conexão', connectionError)
  if (!connection) return callbackRedirect(false, 'Conexão não encontrada (state inválido).')

  if (oauthError || !code) {
    await supabase.from('digital_asset_connections').update({ status: 'error' }).eq('id', connection.id)
    return callbackRedirect(false, `Conexão cancelada ou recusada${oauthError ? `: ${oauthError}` : ''}.`)
  }

  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1${url.pathname}`

  let accessToken: string
  let refreshToken: string | undefined
  let expiresIn: number

  if (connection.provider === 'meta_ads') {
    // Meta: a troca é GET com parâmetros na URL (não POST), e o token
    // de curta duração (~1-2h) precisa ser trocado por um de longa
    // duração (60 dias) logo em seguida — não existe "refresh_token"
    // separado como no Google; renovar significa reexecutar essa
    // mesma troca antes do token vencer (ver `getValidAccessToken`).
    const shortTokenUrl = new URL(META_TOKEN_URL)
    shortTokenUrl.searchParams.set('client_id', Deno.env.get('META_APP_ID') ?? '')
    shortTokenUrl.searchParams.set('client_secret', Deno.env.get('META_APP_SECRET') ?? '')
    shortTokenUrl.searchParams.set('redirect_uri', redirectUri)
    shortTokenUrl.searchParams.set('code', code)

    const shortTokenRes = await fetch(shortTokenUrl.toString())
    const shortTokenBody = await shortTokenRes.json()
    if (!shortTokenRes.ok) {
      await supabase.from('digital_asset_connections').update({ status: 'error' }).eq('id', connection.id)
      return platformErrorRedirect('handleCallback: trocar token curto', 'Meta', shortTokenBody)
    }

    const longTokenUrl = new URL(META_TOKEN_URL)
    longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longTokenUrl.searchParams.set('client_id', Deno.env.get('META_APP_ID') ?? '')
    longTokenUrl.searchParams.set('client_secret', Deno.env.get('META_APP_SECRET') ?? '')
    longTokenUrl.searchParams.set('fb_exchange_token', shortTokenBody.access_token)

    const longTokenRes = await fetch(longTokenUrl.toString())
    const longTokenBody = await longTokenRes.json()
    if (!longTokenRes.ok) {
      await supabase.from('digital_asset_connections').update({ status: 'error' }).eq('id', connection.id)
      return platformErrorRedirect('handleCallback: trocar token longo', 'Meta', longTokenBody)
    }

    accessToken = longTokenBody.access_token as string
    refreshToken = undefined
    expiresIn = (longTokenBody.expires_in as number | undefined) ?? 5_184_000 // ~60 dias, padrão do Meta
  } else {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get(GOOGLE_OAUTH_CLIENT_ID_ENV) ?? '',
        client_secret: Deno.env.get(GOOGLE_OAUTH_CLIENT_SECRET_ENV) ?? '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })
    const tokenBody = await tokenRes.json()
    if (!tokenRes.ok) {
      await supabase.from('digital_asset_connections').update({ status: 'error' }).eq('id', connection.id)
      return platformErrorRedirect('handleCallback: trocar token', 'Google', tokenBody)
    }

    accessToken = tokenBody.access_token as string
    refreshToken = tokenBody.refresh_token as string | undefined
    expiresIn = (tokenBody.expires_in as number | undefined) ?? 3600
  }

  const { data: accessSecretId, error: accessSecretError } = await supabase.rpc('store_oauth_secret', { secret: accessToken })
  if (accessSecretError) {
    console.error('[integrations] handleCallback: guardar token de acesso:', accessSecretError)
    await supabase.from('digital_asset_connections').update({ status: 'error' }).eq('id', connection.id)
    return callbackRedirect(false, 'Não foi possível guardar o token com segurança.')
  }

  const tokenUpsert: Record<string, unknown> = {
    connection_id: connection.id,
    access_token_secret_id: accessSecretId,
    expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
  }
  if (refreshToken) {
    const { data: refreshSecretId } = await supabase.rpc('store_oauth_secret', { secret: refreshToken })
    if (refreshSecretId) tokenUpsert.refresh_token_secret_id = refreshSecretId
  }

  await supabase.from('oauth_tokens').upsert(tokenUpsert, { onConflict: 'connection_id' })

  // Descobre qual conta de anúncios essa conta do Google/Meta enxerga,
  // e já grava — não derruba a conexão se isso falhar (dá pra tentar
  // de novo na primeira sincronização).
  if (connection.provider === 'google_ads') {
    try {
      const customersRes = await fetch(
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'developer-token': Deno.env.get(GOOGLE_ADS_DEVELOPER_TOKEN_ENV) ?? '',
          },
        },
      )
      const customersBody = await customersRes.json()
      const firstResourceName = customersBody.resourceNames?.[0] as string | undefined
      if (firstResourceName) {
        const customerId = firstResourceName.split('/')[1]
        await supabase.from('digital_asset_connections').update({ external_account_id: customerId }).eq('id', connection.id)
      }
    } catch {
      // segue sem quebrar a conexão — ver comentário acima
    }
  } else if (connection.provider === 'meta_ads') {
    try {
      const adAccountsRes = await fetch(
        `https://graph.facebook.com/${META_GRAPH_API_VERSION}/me/adaccounts?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
      )
      const adAccountsBody = await adAccountsRes.json()
      const firstAccountId = adAccountsBody.data?.[0]?.id as string | undefined
      if (firstAccountId) {
        await supabase.from('digital_asset_connections').update({ external_account_id: firstAccountId }).eq('id', connection.id)
      }
    } catch {
      // segue sem quebrar a conexão — ver comentário acima
    }
  }

  await supabase.from('digital_asset_connections').update({ status: 'connected' }).eq('id', connection.id)

  return callbackRedirect(true, 'Integração conectada com sucesso.')
}

async function getValidAccessToken(supabase: SupabaseClient, connectionId: string, provider: Provider): Promise<string | null> {
  const { data: tokenRow } = await supabase
    .from('oauth_tokens')
    .select('access_token_secret_id, refresh_token_secret_id, expires_at')
    .eq('connection_id', connectionId)
    .maybeSingle()
  if (!tokenRow) return null

  const isExpiringSoon = tokenRow.expires_at ? new Date(tokenRow.expires_at).getTime() < Date.now() + 60_000 : false

  if (!isExpiringSoon) {
    const { data: accessToken } = await supabase.rpc('read_oauth_secret', { secret_id: tokenRow.access_token_secret_id })
    return (accessToken as string | null) ?? null
  }

  if (provider === 'meta_ads') {
    // Sem "refresh_token" separado — renova reexecutando a troca por
    // um token de longa duração novo, usando o token atual (que
    // ainda precisa estar válido; se já venceu de vez, não tem como
    // renovar e a conexão precisa ser refeita — marca "error").
    const { data: currentToken } = await supabase.rpc('read_oauth_secret', { secret_id: tokenRow.access_token_secret_id })
    if (!currentToken) return null

    const longTokenUrl = new URL(META_TOKEN_URL)
    longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longTokenUrl.searchParams.set('client_id', Deno.env.get('META_APP_ID') ?? '')
    longTokenUrl.searchParams.set('client_secret', Deno.env.get('META_APP_SECRET') ?? '')
    longTokenUrl.searchParams.set('fb_exchange_token', currentToken as string)

    const longTokenRes = await fetch(longTokenUrl.toString())
    const longTokenBody = await longTokenRes.json()
    if (!longTokenRes.ok) {
      await supabase.from('digital_asset_connections').update({ status: 'error' }).eq('id', connectionId)
      return null
    }

    const { data: newAccessSecretId } = await supabase.rpc('store_oauth_secret', { secret: longTokenBody.access_token })
    await supabase
      .from('oauth_tokens')
      .update({
        access_token_secret_id: newAccessSecretId,
        expires_at: new Date(Date.now() + (longTokenBody.expires_in ?? 5_184_000) * 1000).toISOString(),
      })
      .eq('connection_id', connectionId)

    return longTokenBody.access_token as string
  }

  if (!tokenRow.refresh_token_secret_id) return null
  const { data: refreshToken } = await supabase.rpc('read_oauth_secret', { secret_id: tokenRow.refresh_token_secret_id })
  if (!refreshToken) return null

  const refreshRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get(GOOGLE_OAUTH_CLIENT_ID_ENV) ?? '',
      client_secret: Deno.env.get(GOOGLE_OAUTH_CLIENT_SECRET_ENV) ?? '',
      refresh_token: refreshToken as string,
      grant_type: 'refresh_token',
    }),
  })
  const refreshBody = await refreshRes.json()
  if (!refreshRes.ok) return null

  const { data: newAccessSecretId } = await supabase.rpc('store_oauth_secret', { secret: refreshBody.access_token })
  await supabase
    .from('oauth_tokens')
    .update({
      access_token_secret_id: newAccessSecretId,
      expires_at: new Date(Date.now() + (refreshBody.expires_in ?? 3600) * 1000).toISOString(),
    })
    .eq('connection_id', connectionId)

  return refreshBody.access_token as string
}

type SyncableConnection = {
  id: string
  provider: Provider
  external_account_id: string | null
  digital_assets: { client_id: string } | { client_id: string }[]
}

type SyncResult = { ok: true; syncedDays: number } | { ok: false; error: string }

/** Núcleo da sincronização de UMA conexão (Google Ads ou Meta Ads) —
 * nunca lança erro, sempre devolve um resultado. Reaproveitado pela
 * rota /sync (um clique, autenticada por login) e por /sync-all
 * (rodada pelo cron a cada poucas horas, ver handleSyncAll). */
async function syncConnection(supabase: SupabaseClient, connection: SyncableConnection): Promise<SyncResult> {
  if (connection.provider !== 'google_ads' && connection.provider !== 'meta_ads') {
    return { ok: false, error: 'Sincronização só implementada pra Google Ads e Meta Ads' }
  }
  if (!connection.external_account_id) {
    return { ok: false, error: 'Conexão incompleta (falta conta de anúncios)' }
  }

  const accessToken = await getValidAccessToken(supabase, connection.id, connection.provider)
  if (!accessToken) return { ok: false, error: 'Não foi possível obter um token de acesso válido' }

  const byDate = new Map<string, { spend: number; clicks: number; impressions: number; conversions: number }>()
  // Mesmos números que "byDate", só que quebrados por campanha também —
  // alimenta campaign_performance_snapshots (Fase 8.1b), sem mudar em
  // nada o agregado por conta que já existia (performance_snapshots).
  const byCampaign = new Map<
    string,
    { campaignId: string; campaignName: string; date: string; spend: number; clicks: number; impressions: number; conversions: number }
  >()

  if (connection.provider === 'google_ads') {
    const gaqlQuery = `
      SELECT segments.date, campaign.id, campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
    `

    const searchRes = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${connection.external_account_id}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': Deno.env.get(GOOGLE_ADS_DEVELOPER_TOKEN_ENV) ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: gaqlQuery }),
      },
    )
    const searchBody = await searchRes.json()
    if (!searchRes.ok) {
      return platformSyncError('syncConnection: Google Ads search', 'Google Ads', searchBody)
    }

    for (const row of (searchBody.results ?? []) as Array<Record<string, Record<string, unknown>>>) {
      const date = row.segments?.date as string | undefined
      if (!date) continue
      const acc = byDate.get(date) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
      const spend = Number(row.metrics?.costMicros ?? 0) / 1_000_000
      const clicks = Number(row.metrics?.clicks ?? 0)
      const impressions = Number(row.metrics?.impressions ?? 0)
      const conversions = Number(row.metrics?.conversions ?? 0)
      acc.spend += spend
      acc.clicks += clicks
      acc.impressions += impressions
      acc.conversions += conversions
      byDate.set(date, acc)

      const campaignId = row.campaign?.id != null ? String(row.campaign.id) : undefined
      if (campaignId) {
        const key = `${campaignId}|${date}`
        const campAcc = byCampaign.get(key) ?? {
          campaignId,
          campaignName: (row.campaign?.name as string | undefined) ?? campaignId,
          date,
          spend: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
        }
        campAcc.spend += spend
        campAcc.clicks += clicks
        campAcc.impressions += impressions
        campAcc.conversions += conversions
        byCampaign.set(key, campAcc)
      }
    }
  } else {
    // meta_ads — Insights da Graph API, já quebrado por dia
    // (time_increment=1). "conversions" não existe como número único
    // no Meta — vem dentro de "actions" (lista de tipo de ação +
    // valor); somo todos os valores como uma aproximação razoável de
    // conversões, não uma contagem exata de um tipo específico
    // (refinável depois, se precisar discriminar por tipo de ação).
    // level=campaign devolve uma linha por campanha+dia (em vez de uma
    // linha por dia só, agregando a conta inteira) — dá pra montar os
    // dois níveis (byDate/byCampaign) a partir da mesma chamada.
    const insightsUrl = new URL(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/${connection.external_account_id}/insights`)
    insightsUrl.searchParams.set('level', 'campaign')
    insightsUrl.searchParams.set('fields', 'campaign_id,campaign_name,spend,clicks,impressions,actions')
    insightsUrl.searchParams.set('date_preset', 'last_30d')
    insightsUrl.searchParams.set('time_increment', '1')
    insightsUrl.searchParams.set('access_token', accessToken)

    const insightsRes = await fetch(insightsUrl.toString())
    const insightsBody = await insightsRes.json()
    if (!insightsRes.ok) {
      return platformSyncError('syncConnection: Meta insights', 'Meta Ads', insightsBody)
    }

    for (const row of (insightsBody.data ?? []) as Array<Record<string, unknown>>) {
      const date = row.date_start as string | undefined
      if (!date) continue
      const actions = (row.actions ?? []) as Array<{ value?: string }>
      const conversions = actions.reduce((sum, a) => sum + Number(a.value ?? 0), 0)
      const spend = Number(row.spend ?? 0)
      const clicks = Number(row.clicks ?? 0)
      const impressions = Number(row.impressions ?? 0)
      const acc = byDate.get(date) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
      acc.spend += spend
      acc.clicks += clicks
      acc.impressions += impressions
      acc.conversions += conversions
      byDate.set(date, acc)

      const campaignId = row.campaign_id as string | undefined
      if (campaignId) {
        const key = `${campaignId}|${date}`
        const campAcc = byCampaign.get(key) ?? {
          campaignId,
          campaignName: (row.campaign_name as string | undefined) ?? campaignId,
          date,
          spend: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
        }
        campAcc.spend += spend
        campAcc.clicks += clicks
        campAcc.impressions += impressions
        campAcc.conversions += conversions
        byCampaign.set(key, campAcc)
      }
    }
  }

  const clientId = (connection.digital_assets as unknown as { client_id: string }).client_id
  const rows = Array.from(byDate.entries()).map(([date, m]) => ({
    client_id: clientId,
    snapshot_date: date,
    spend: m.spend,
    clicks: m.clicks,
    impressions: m.impressions,
    conversions: m.conversions,
    channel: connection.provider,
  }))

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from('performance_snapshots')
      .upsert(rows, { onConflict: 'client_id,channel,snapshot_date' })
    if (upsertError) return dbSyncError('syncConnection: upsert performance_snapshots', upsertError)
  }

  const campaignRows = Array.from(byCampaign.values()).map((c) => ({
    connection_id: connection.id,
    external_campaign_id: c.campaignId,
    external_campaign_name: c.campaignName,
    client_id: clientId,
    channel: connection.provider,
    snapshot_date: c.date,
    spend: c.spend,
    clicks: c.clicks,
    impressions: c.impressions,
    conversions: c.conversions,
  }))

  if (campaignRows.length > 0) {
    const { error: campaignUpsertError } = await supabase
      .from('campaign_performance_snapshots')
      .upsert(campaignRows, { onConflict: 'connection_id,external_campaign_id,snapshot_date' })
    if (campaignUpsertError) return dbSyncError('syncConnection: upsert campaign_performance_snapshots', campaignUpsertError)
  }

  await supabase.from('digital_asset_connections').update({ last_synced_at: new Date().toISOString() }).eq('id', connection.id)

  return { ok: true, syncedDays: rows.length }
}

type FormQuestionRow = {
  externalQuestionId: string
  title: string
  questionType: string
  options: string[] | null
  position: number
}

/** Normaliza o tipo de UMA pergunta (`questionItem.question` da API do
 * Forms) pro vocabulário fixo usado em `form_questions.question_type` —
 * ver lista completa no comentário da migration-033. */
function normalizeQuestionType(question: Record<string, unknown>): { questionType: string; options: string[] | null } {
  const choiceQuestion = question.choiceQuestion as Record<string, unknown> | undefined
  if (choiceQuestion) {
    const type = (choiceQuestion.type as string | undefined) ?? 'RADIO'
    const questionType = type === 'CHECKBOX' ? 'choice_checkbox' : type === 'DROP_DOWN' ? 'choice_dropdown' : 'choice_radio'
    const options = ((choiceQuestion.options as Array<{ value?: string }> | undefined) ?? [])
      .map((o) => o.value)
      .filter((v): v is string => !!v)
    return { questionType, options: options.length > 0 ? options : null }
  }

  const textQuestion = question.textQuestion as Record<string, unknown> | undefined
  if (textQuestion) {
    return { questionType: textQuestion.paragraph ? 'text_paragraph' : 'text_short', options: null }
  }

  if (question.scaleQuestion) return { questionType: 'scale', options: null }
  if (question.dateQuestion) return { questionType: 'date', options: null }
  if (question.timeQuestion) return { questionType: 'time', options: null }
  if (question.fileUploadQuestion) return { questionType: 'file_upload', options: null }

  return { questionType: 'other', options: null }
}

/** Achata `items[]` (resposta de `GET /v1/forms/{formId}`) numa linha
 * por pergunta — perguntas de grade (`questionGroupItem`) viram uma
 * linha por sub-pergunta (linha da grade), melhor esforço, é o formato
 * mais raro de aparecer. Itens sem pergunta (texto de seção, quebra de
 * página) são ignorados. */
function normalizeFormItems(items: Array<Record<string, unknown>>): FormQuestionRow[] {
  const rows: FormQuestionRow[] = []

  items.forEach((item, index) => {
    const title = (item.title as string | undefined) ?? ''
    const questionItem = item.questionItem as Record<string, unknown> | undefined
    if (questionItem) {
      const question = questionItem.question as Record<string, unknown> | undefined
      const questionId = question?.questionId as string | undefined
      if (!question || !questionId) return
      const { questionType, options } = normalizeQuestionType(question)
      rows.push({ externalQuestionId: questionId, title, questionType, options, position: index })
      return
    }

    const questionGroupItem = item.questionGroupItem as Record<string, unknown> | undefined
    if (questionGroupItem) {
      const questions = (questionGroupItem.questions as Array<Record<string, unknown>> | undefined) ?? []
      const grid = questionGroupItem.grid as Record<string, unknown> | undefined
      const columns = grid?.columns as Record<string, unknown> | undefined
      const gridOptions = ((columns?.options as Array<{ value?: string }> | undefined) ?? [])
        .map((o) => o.value)
        .filter((v): v is string => !!v)

      questions.forEach((subQuestion) => {
        const questionId = subQuestion.questionId as string | undefined
        if (!questionId) return
        const rowTitle = (subQuestion.rowQuestion as Record<string, unknown> | undefined)?.title as string | undefined
        rows.push({
          externalQuestionId: questionId,
          title: rowTitle ? `${title} — ${rowTitle}` : title,
          questionType: 'grid_row',
          options: gridOptions.length > 0 ? gridOptions : null,
          position: index,
        })
      })
    }
  })

  return rows
}

type FormAnswerRow = { externalQuestionId: string; answerText: string | null; answerValues: string[] | null }

/** Achata `answers{}` (dentro de UMA resposta, de `GET
 * /v1/forms/{formId}/responses`) numa linha por pergunta respondida —
 * `answerValues` preserva múltipla escolha como array; `answerText` é
 * só a versão pronta pra exibir (valores juntos com ", "). */
function normalizeFormAnswers(answers: Record<string, unknown>): FormAnswerRow[] {
  return Object.values(answers)
    .map((raw) => raw as Record<string, unknown>)
    .filter((answer) => typeof answer.questionId === 'string')
    .map((answer) => {
      const externalQuestionId = answer.questionId as string
      const textAnswers = answer.textAnswers as Record<string, unknown> | undefined
      const textValues = ((textAnswers?.answers as Array<{ value?: string }> | undefined) ?? [])
        .map((a) => a.value)
        .filter((v): v is string => !!v)
      if (textValues.length > 0) {
        return { externalQuestionId, answerText: textValues.join(', '), answerValues: textValues }
      }

      const fileUploadAnswers = answer.fileUploadAnswers as Record<string, unknown> | undefined
      const fileNames = ((fileUploadAnswers?.answers as Array<{ fileName?: string }> | undefined) ?? [])
        .map((f) => f.fileName)
        .filter((v): v is string => !!v)
      if (fileNames.length > 0) {
        return { externalQuestionId, answerText: fileNames.join(', '), answerValues: fileNames }
      }

      return { externalQuestionId, answerText: null, answerValues: null }
    })
}

type FormsSyncResult = { ok: true; syncedQuestions: number; syncedResponses: number } | { ok: false; error: string }

/** Núcleo da sincronização estruturada de UMA conexão de Google Forms
 * (Fase 8.2) — busca a estrutura do formulário e TODAS as respostas
 * (inclusive antigas, de antes da conexão existir) direto da API
 * oficial (forms.googleapis.com), usando o token OAuth que a conexão já
 * guarda desde a Fase 6.2. Reaproveitada por /sync e /sync-all, mesmo
 * contrato de `syncConnection` (nunca lança, sempre devolve um
 * resultado). Não mexe em nada do que /forms-webhook já faz (o Alerta
 * genérico continua sendo criado à parte, sem mudança). */
async function syncFormsConnection(supabase: SupabaseClient, connection: SyncableConnection): Promise<FormsSyncResult> {
  if (connection.provider !== 'google_forms') {
    return { ok: false, error: 'Sincronização estruturada só implementada pro Google Forms' }
  }
  if (!connection.external_account_id) {
    return { ok: false, error: 'Conexão incompleta (falta o id do formulário)' }
  }

  const accessToken = await getValidAccessToken(supabase, connection.id, 'google_forms')
  if (!accessToken) return { ok: false, error: 'Não foi possível obter um token de acesso válido' }

  const formId = connection.external_account_id

  const formRes = await fetch(`${GOOGLE_FORMS_API_BASE}/${formId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const formBody = await formRes.json()
  if (!formRes.ok) {
    return platformSyncError('syncFormsConnection: buscar estrutura do formulário', 'Google Forms', formBody)
  }

  const questionRows = normalizeFormItems((formBody.items ?? []) as Array<Record<string, unknown>>)
  if (questionRows.length > 0) {
    const { error: questionsError } = await supabase.from('form_questions').upsert(
      questionRows.map((q) => ({
        connection_id: connection.id,
        external_question_id: q.externalQuestionId,
        title: q.title,
        question_type: q.questionType,
        options: q.options,
        position: q.position,
      })),
      { onConflict: 'connection_id,external_question_id' },
    )
    if (questionsError) return dbSyncError('syncFormsConnection: upsert form_questions', questionsError)
  }

  const clientId = (connection.digital_assets as unknown as { client_id: string }).client_id

  let syncedResponses = 0
  let pageToken: string | undefined

  do {
    const responsesUrl = new URL(`${GOOGLE_FORMS_API_BASE}/${formId}/responses`)
    responsesUrl.searchParams.set('pageSize', '200')
    if (pageToken) responsesUrl.searchParams.set('pageToken', pageToken)

    const responsesRes = await fetch(responsesUrl.toString(), { headers: { Authorization: `Bearer ${accessToken}` } })
    const responsesBody = await responsesRes.json()
    if (!responsesRes.ok) {
      return platformSyncError('syncFormsConnection: buscar respostas', 'Google Forms', responsesBody)
    }

    const responses = (responsesBody.responses ?? []) as Array<Record<string, unknown>>
    for (const response of responses) {
      const externalResponseId = response.responseId as string | undefined
      if (!externalResponseId) continue

      const { data: responseRow, error: responseError } = await supabase
        .from('form_responses')
        .upsert(
          {
            connection_id: connection.id,
            external_response_id: externalResponseId,
            client_id: clientId,
            submitted_at: (response.lastSubmittedTime as string | undefined) ?? (response.createTime as string | undefined) ?? null,
          },
          { onConflict: 'connection_id,external_response_id' },
        )
        .select('id')
        .single()
      if (responseError) return dbSyncError('syncFormsConnection: upsert form_responses', responseError)

      const answerRows = normalizeFormAnswers((response.answers ?? {}) as Record<string, unknown>)
      if (answerRows.length > 0) {
        const { error: answersError } = await supabase.from('form_answers').upsert(
          answerRows.map((a) => ({
            response_id: responseRow.id,
            external_question_id: a.externalQuestionId,
            answer_text: a.answerText,
            answer_values: a.answerValues,
          })),
          { onConflict: 'response_id,external_question_id' },
        )
        if (answersError) return dbSyncError('syncFormsConnection: upsert form_answers', answersError)
      }

      syncedResponses += 1
    }

    pageToken = responsesBody.nextPageToken as string | undefined
  } while (pageToken)

  await supabase.from('digital_asset_connections').update({ last_synced_at: new Date().toISOString() }).eq('id', connection.id)

  return { ok: true, syncedQuestions: questionRows.length, syncedResponses }
}

async function handleSync(req: Request) {
  const auth = await requireAdminOrGestor(req)
  if (auth instanceof Response) return auth

  let body: { connection_id?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo inválido' }, 400)
  }
  if (!body.connection_id) return jsonResponse({ error: 'connection_id é obrigatório' }, 400)

  const supabase = getServiceClient()

  const { data: connection, error: connectionError } = await supabase
    .from('digital_asset_connections')
    .select('id, provider, external_account_id, digital_assets(client_id)')
    .eq('id', body.connection_id)
    .maybeSingle()
  if (connectionError) return dbErrorResponse('handleSync: buscar conexão', connectionError)
  if (!connection) return jsonResponse({ error: 'Conexão não encontrada' }, 404)

  if (connection.provider === 'google_forms') {
    const result = await syncFormsConnection(supabase, connection as SyncableConnection)
    if (!result.ok) return jsonResponse({ error: result.error }, 502)
    return jsonResponse({ ok: true, syncedQuestions: result.syncedQuestions, syncedResponses: result.syncedResponses })
  }

  const result = await syncConnection(supabase, connection as SyncableConnection)
  if (!result.ok) return jsonResponse({ error: result.error }, 502)
  return jsonResponse({ ok: true, syncedDays: result.syncedDays })
}

/** Lista as campanhas reais de uma conta já conectada (Google Ads/Meta
 * Ads) — usada pelo campo de vincular um projeto a uma campanha
 * específica (Fase 8.1b). Só lê, não grava nada. */
async function handleListCampaigns(req: Request, url: URL) {
  const auth = await requireAdminOrGestor(req)
  if (auth instanceof Response) return auth

  const connectionId = url.searchParams.get('connection_id')
  if (!connectionId) return jsonResponse({ error: 'connection_id é obrigatório' }, 400)

  const supabase = getServiceClient()

  const { data: connection, error: connectionError } = await supabase
    .from('digital_asset_connections')
    .select('id, provider, external_account_id')
    .eq('id', connectionId)
    .maybeSingle()
  if (connectionError) return dbErrorResponse('handleListCampaigns: buscar conexão', connectionError)
  if (!connection) return jsonResponse({ error: 'Conexão não encontrada' }, 404)
  if (connection.provider !== 'google_ads' && connection.provider !== 'meta_ads') {
    return jsonResponse({ error: 'Listagem de campanhas só disponível pra Google Ads e Meta Ads' }, 400)
  }
  if (!connection.external_account_id) {
    return jsonResponse({ error: 'Conexão incompleta (falta conta de anúncios)' }, 400)
  }

  const accessToken = await getValidAccessToken(supabase, connection.id, connection.provider)
  if (!accessToken) return jsonResponse({ error: 'Não foi possível obter um token de acesso válido' }, 502)

  if (connection.provider === 'google_ads') {
    const gaqlQuery = `
      SELECT campaign.id, campaign.name, campaign.status
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.name
    `
    const searchRes = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${connection.external_account_id}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': Deno.env.get(GOOGLE_ADS_DEVELOPER_TOKEN_ENV) ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: gaqlQuery }),
      },
    )
    const searchBody = await searchRes.json()
    if (!searchRes.ok) {
      return platformErrorResponse('handleListCampaigns', 'Google Ads', searchBody)
    }

    const campaigns = ((searchBody.results ?? []) as Array<Record<string, Record<string, unknown>>>).map((row) => ({
      id: String(row.campaign?.id ?? ''),
      name: (row.campaign?.name as string | undefined) ?? '',
      status: (row.campaign?.status as string | undefined) ?? '',
    }))
    return jsonResponse({ campaigns })
  }

  // meta_ads
  const campaignsUrl = new URL(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/${connection.external_account_id}/campaigns`)
  campaignsUrl.searchParams.set('fields', 'id,name,status')
  campaignsUrl.searchParams.set('access_token', accessToken)

  const campaignsRes = await fetch(campaignsUrl.toString())
  const campaignsBody = await campaignsRes.json()
  if (!campaignsRes.ok) {
    return platformErrorResponse('handleListCampaigns', 'Meta Ads', campaignsBody)
  }

  const campaigns = ((campaignsBody.data ?? []) as Array<{ id: string; name: string; status: string }>).map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
  }))
  return jsonResponse({ campaigns })
}

/** Chamada pelo job agendado (pg_cron + pg_net, ver
 * migration-019-fase64-cron.sql) a cada poucas horas — não tem login
 * de usuário por trás (roda sozinha, de dentro do Postgres), então se
 * autentica com um segredo compartilhado, mesmo padrão já usado em
 * /forms-webhook. Sincroniza todas as conexões "connected" de Google
 * Ads/Meta Ads (métricas) e Google Forms (perguntas+respostas
 * estruturadas, Fase 8.2), uma de cada vez, sem deixar uma falha
 * derrubar as outras (cada uma tenta renovar o token sozinha dentro de
 * syncConnection/syncFormsConnection, via getValidAccessToken). */
async function handleSyncAll(req: Request) {
  const secret = req.headers.get('X-Cron-Secret') ?? ''
  const expectedSecret = Deno.env.get('CRON_SECRET') ?? ''
  if (!expectedSecret || !safeCompare(secret, expectedSecret)) {
    return jsonResponse({ error: 'Não autorizado' }, 401)
  }

  const supabase = getServiceClient()

  const { data: connections, error: connectionsError } = await supabase
    .from('digital_asset_connections')
    .select('id, provider, external_account_id, digital_assets(client_id)')
    .eq('status', 'connected')
    .in('provider', ['google_ads', 'meta_ads', 'google_forms'])
  if (connectionsError) return dbErrorResponse('handleSyncAll: buscar conexões', connectionsError)

  const results: Array<{ connectionId: string } & (SyncResult | FormsSyncResult)> = []
  for (const connection of (connections ?? []) as SyncableConnection[]) {
    const result =
      connection.provider === 'google_forms'
        ? await syncFormsConnection(supabase, connection)
        : await syncConnection(supabase, connection)
    results.push({ connectionId: connection.id, ...result })
  }

  return jsonResponse({ ok: true, results })
}

async function handleFormsWebhook(req: Request) {
  const secret = req.headers.get('X-Webhook-Secret') ?? ''
  const expectedSecret = Deno.env.get('FORMS_WEBHOOK_SECRET') ?? ''
  if (!expectedSecret || !safeCompare(secret, expectedSecret)) {
    return jsonResponse({ error: 'Não autorizado' }, 401)
  }

  let body: { formId?: string; responseId?: string; answers?: Record<string, string> }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo inválido' }, 400)
  }
  if (!body.formId || !body.responseId) {
    return jsonResponse({ error: 'formId e responseId são obrigatórios' }, 400)
  }

  const supabase = getServiceClient()

  const { data: connection, error: connectionError } = await supabase
    .from('digital_asset_connections')
    .select('id, digital_assets(client_id)')
    .eq('provider', 'google_forms')
    .eq('external_account_id', body.formId)
    .maybeSingle()
  if (connectionError) return dbErrorResponse('handleFormsWebhook: buscar conexão', connectionError)
  if (!connection) return jsonResponse({ error: 'Nenhum formulário conectado com esse id' }, 404)

  const { error: dedupeError } = await supabase
    .from('form_response_events')
    .insert({ connection_id: connection.id, response_id: body.responseId })
  if (dedupeError) {
    if (dedupeError.code === '23505') return jsonResponse({ ok: true, duplicate: true })
    return dbErrorResponse('handleFormsWebhook: registrar dedup', dedupeError)
  }

  const clientId = (connection.digital_assets as unknown as { client_id: string }).client_id
  const answersText =
    Object.entries(body.answers ?? {})
      .map(([question, answer]) => `${question}: ${answer}`)
      .join('\n') || 'Resposta recebida sem respostas detalhadas.'

  const { error: alertError } = await supabase.from('alerts').insert({
    title: 'Nova resposta de formulário',
    message: answersText,
    client_id: clientId,
    severity: 'medium',
    category: 'novo_lead',
  })
  if (alertError) return dbErrorResponse('handleFormsWebhook: inserir alerta', alertError)

  return jsonResponse({ ok: true })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)

  try {
    if (req.method === 'GET' && url.pathname.endsWith('/connect')) return await handleConnect(req, url)
    if (req.method === 'GET' && url.pathname.endsWith('/callback')) return await handleCallback(url)
    if (req.method === 'GET' && url.pathname.endsWith('/campaigns')) return await handleListCampaigns(req, url)
    if (req.method === 'POST' && url.pathname.endsWith('/sync-all')) return await handleSyncAll(req)
    if (req.method === 'POST' && url.pathname.endsWith('/sync')) return await handleSync(req)
    if (req.method === 'POST' && url.pathname.endsWith('/forms-webhook')) return await handleFormsWebhook(req)
    return jsonResponse(
      { error: 'Rota não encontrada. Use /connect, /callback, /campaigns, /sync, /sync-all ou /forms-webhook.' },
      404,
    )
  } catch (err) {
    console.error('[integrations] erro inesperado:', err)
    return jsonResponse({ error: 'Erro inesperado. Tente novamente.' }, 500)
  }
})
