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
// SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL):
//   GOOGLE_OAUTH_CLIENT_ID       — do Google Cloud Console
//   GOOGLE_OAUTH_CLIENT_SECRET   — do Google Cloud Console
//   GOOGLE_ADS_DEVELOPER_TOKEN   — do Google Ads Manager Account
//   META_APP_ID                  — do app em developers.facebook.com
//   META_APP_SECRET              — do app em developers.facebook.com
//   FORMS_WEBHOOK_SECRET         — inventado por você, usado também no
//                                   script do Apps Script (ver
//                                   forms-trigger.gs.txt)
//   FRONTEND_URL                 — ex: http://localhost:5173 (sem
//                                   barra no final)
//
// Rotas (identificadas pelo final do path da requisição):
//   GET  .../integrations/connect?provider=google_ads&digital_asset_id=...&project_id=...
//   GET  .../integrations/connect?provider=google_forms&digital_asset_id=...&form_id=...
//   GET  .../integrations/connect?provider=meta_ads&digital_asset_id=...&project_id=...
//   GET  .../integrations/callback?state=...&code=...          (aberta pelo Google/Meta)
//   POST .../integrations/sync            { connection_id }
//   POST .../integrations/forms-webhook   { formId, responseId, submittedAt, answers }
//                                          (cabeçalho X-Webhook-Secret)

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const PROVIDERS = ['google_ads', 'google_forms', 'meta_ads'] as const
type Provider = (typeof PROVIDERS)[number]

const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ADS_API_VERSION = 'v17' // conferir se ainda é a versão suportada quando for testar de verdade — a Google descontinua versões antigas com o tempo

const GOOGLE_SCOPES: Record<'google_ads' | 'google_forms', string> = {
  google_ads: 'https://www.googleapis.com/auth/adwords',
  google_forms: 'https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/forms.responses.readonly',
}

const META_GRAPH_API_VERSION = 'v19.0' // conferir se ainda é suportada quando for testar de verdade
const META_AUTHORIZE_URL = `https://www.facebook.com/${META_GRAPH_API_VERSION}/dialog/oauth`
const META_TOKEN_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/oauth/access_token`
const META_SCOPE = 'ads_read' // só leitura de métricas — nada de gerenciar campanha

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function htmlResponse(html: string, status = 200) {
  return new Response(html, { status, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } })
}

/** Página que o navegador da pessoa vê ao voltar do login do Google —
 * manda ela de volta pro app depois de um instante. */
function callbackLandingPage(success: boolean, message: string) {
  const frontendUrl = Deno.env.get('FRONTEND_URL') ?? 'http://localhost:5173'
  const target = `${frontendUrl}/assets`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${success ? 'Conectado' : 'Erro ao conectar'}</title>
<meta http-equiv="refresh" content="2;url=${target}">
</head><body style="font-family: system-ui, sans-serif; padding: 2rem; background: #0B1220; color: #fff;">
<p>${message}</p>
<p><a href="${target}" style="color:#7C3AED;">Clique aqui se não for redirecionado automaticamente.</a></p>
<script>setTimeout(function () { window.location.href = ${JSON.stringify(target)} }, 1800)</script>
</body></html>`
  return htmlResponse(html)
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

  const projectId = url.searchParams.get('project_id')
  const formIdInput = url.searchParams.get('form_id')

  if ((provider === 'google_ads' || provider === 'meta_ads') && !projectId) {
    return jsonResponse({ error: 'Escolha o projeto que vai receber as métricas' }, 400)
  }
  if (provider === 'google_forms' && !formIdInput) {
    return jsonResponse({ error: 'Informe o id ou o link do formulário' }, 400)
  }

  // Falha aqui dentro, com uma mensagem clara, em vez de mandar a
  // pessoa pro Google/Meta com um link quebrado (os dois recusam um
  // "client_id" vazio com um erro genérico, sem nem mostrar login).
  if (provider !== 'meta_ads' && !Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')) {
    return jsonResponse(
      { error: 'As credenciais do Google ainda não foram configuradas nesta função (falta o segredo GOOGLE_OAUTH_CLIENT_ID).' },
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
  if (assetError) return jsonResponse({ error: assetError.message }, 500)
  if (!asset) return jsonResponse({ error: 'Ativo digital não encontrado' }, 404)

  const upsertPayload: Record<string, unknown> = { digital_asset_id: digitalAssetId, provider, status: 'disconnected' }
  if (provider === 'google_ads' || provider === 'meta_ads') upsertPayload.project_id = projectId
  if (provider === 'google_forms') upsertPayload.external_account_id = extractFormId(formIdInput as string)

  const { data: connection, error: connectionError } = await supabase
    .from('digital_asset_connections')
    .upsert(upsertPayload, { onConflict: 'digital_asset_id,provider', ignoreDuplicates: false })
    .select('id')
    .single()
  if (connectionError) return jsonResponse({ error: connectionError.message }, 500)

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
    authorizationUrl.searchParams.set('client_id', Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') ?? '')
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

  if (!state) return htmlResponse('<p>Parâmetro "state" ausente.</p>', 400)

  const supabase = getServiceClient()

  const { data: connection, error: connectionError } = await supabase
    .from('digital_asset_connections')
    .select('id, provider')
    .eq('id', state)
    .maybeSingle()
  if (connectionError) return htmlResponse(`<p>${connectionError.message}</p>`, 500)
  if (!connection) return htmlResponse('<p>Conexão não encontrada (state inválido).</p>', 404)

  if (oauthError || !code) {
    await supabase.from('digital_asset_connections').update({ status: 'error' }).eq('id', connection.id)
    return callbackLandingPage(false, `Conexão cancelada ou recusada${oauthError ? `: ${oauthError}` : ''}.`)
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
      return callbackLandingPage(false, `Não foi possível conectar: ${shortTokenBody.error?.message ?? 'erro desconhecido'}.`)
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
      return callbackLandingPage(
        false,
        `Não foi possível trocar pelo token de longa duração: ${longTokenBody.error?.message ?? 'erro desconhecido'}.`,
      )
    }

    accessToken = longTokenBody.access_token as string
    refreshToken = undefined
    expiresIn = (longTokenBody.expires_in as number | undefined) ?? 5_184_000 // ~60 dias, padrão do Meta
  } else {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') ?? '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })
    const tokenBody = await tokenRes.json()
    if (!tokenRes.ok) {
      await supabase.from('digital_asset_connections').update({ status: 'error' }).eq('id', connection.id)
      return callbackLandingPage(false, `Não foi possível conectar: ${tokenBody.error_description ?? tokenBody.error ?? 'erro desconhecido'}.`)
    }

    accessToken = tokenBody.access_token as string
    refreshToken = tokenBody.refresh_token as string | undefined
    expiresIn = (tokenBody.expires_in as number | undefined) ?? 3600
  }

  const { data: accessSecretId, error: accessSecretError } = await supabase.rpc('store_oauth_secret', { secret: accessToken })
  if (accessSecretError) {
    await supabase.from('digital_asset_connections').update({ status: 'error' }).eq('id', connection.id)
    return callbackLandingPage(false, 'Não foi possível guardar o token com segurança.')
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
            'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') ?? '',
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

  return callbackLandingPage(true, 'Conectado! Redirecionando...')
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
      client_id: Deno.env.get('GOOGLE_OAUTH_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') ?? '',
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
    .select('id, provider, project_id, external_account_id, digital_assets(client_id)')
    .eq('id', body.connection_id)
    .maybeSingle()
  if (connectionError) return jsonResponse({ error: connectionError.message }, 500)
  if (!connection) return jsonResponse({ error: 'Conexão não encontrada' }, 404)
  if (connection.provider !== 'google_ads' && connection.provider !== 'meta_ads') {
    return jsonResponse({ error: 'Sincronização só implementada pra Google Ads e Meta Ads' }, 400)
  }
  if (!connection.project_id || !connection.external_account_id) {
    return jsonResponse({ error: 'Conexão incompleta (falta projeto ou conta de anúncios)' }, 400)
  }

  const accessToken = await getValidAccessToken(supabase, connection.id, connection.provider)
  if (!accessToken) return jsonResponse({ error: 'Não foi possível obter um token de acesso válido' }, 500)

  const byDate = new Map<string, { spend: number; clicks: number; impressions: number; conversions: number }>()

  if (connection.provider === 'google_ads') {
    const gaqlQuery = `
      SELECT segments.date, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
    `

    const searchRes = await fetch(
      `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${connection.external_account_id}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: gaqlQuery }),
      },
    )
    const searchBody = await searchRes.json()
    if (!searchRes.ok) {
      return jsonResponse({ error: searchBody.error?.message ?? 'Erro ao consultar a Google Ads API' }, 502)
    }

    for (const row of (searchBody.results ?? []) as Array<Record<string, Record<string, unknown>>>) {
      const date = row.segments?.date as string | undefined
      if (!date) continue
      const acc = byDate.get(date) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
      acc.spend += Number(row.metrics?.costMicros ?? 0) / 1_000_000
      acc.clicks += Number(row.metrics?.clicks ?? 0)
      acc.impressions += Number(row.metrics?.impressions ?? 0)
      acc.conversions += Number(row.metrics?.conversions ?? 0)
      byDate.set(date, acc)
    }
  } else {
    // meta_ads — Insights da Graph API, já quebrado por dia
    // (time_increment=1). "conversions" não existe como número único
    // no Meta — vem dentro de "actions" (lista de tipo de ação +
    // valor); somo todos os valores como uma aproximação razoável de
    // conversões, não uma contagem exata de um tipo específico
    // (refinável depois, se precisar discriminar por tipo de ação).
    const insightsUrl = new URL(`https://graph.facebook.com/${META_GRAPH_API_VERSION}/${connection.external_account_id}/insights`)
    insightsUrl.searchParams.set('fields', 'spend,clicks,impressions,actions')
    insightsUrl.searchParams.set('date_preset', 'last_30d')
    insightsUrl.searchParams.set('time_increment', '1')
    insightsUrl.searchParams.set('access_token', accessToken)

    const insightsRes = await fetch(insightsUrl.toString())
    const insightsBody = await insightsRes.json()
    if (!insightsRes.ok) {
      return jsonResponse({ error: insightsBody.error?.message ?? 'Erro ao consultar a Meta Marketing API' }, 502)
    }

    for (const row of (insightsBody.data ?? []) as Array<Record<string, unknown>>) {
      const date = row.date_start as string | undefined
      if (!date) continue
      const actions = (row.actions ?? []) as Array<{ value?: string }>
      const conversions = actions.reduce((sum, a) => sum + Number(a.value ?? 0), 0)
      const acc = byDate.get(date) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
      acc.spend += Number(row.spend ?? 0)
      acc.clicks += Number(row.clicks ?? 0)
      acc.impressions += Number(row.impressions ?? 0)
      acc.conversions += conversions
      byDate.set(date, acc)
    }
  }

  const clientId = (connection.digital_assets as unknown as { client_id: string }).client_id
  const rows = Array.from(byDate.entries()).map(([date, m]) => ({
    client_id: clientId,
    project_id: connection.project_id,
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
      .upsert(rows, { onConflict: 'project_id,snapshot_date' })
    if (upsertError) return jsonResponse({ error: upsertError.message }, 500)
  }

  await supabase.from('digital_asset_connections').update({ last_synced_at: new Date().toISOString() }).eq('id', connection.id)

  return jsonResponse({ ok: true, syncedDays: rows.length })
}

async function handleFormsWebhook(req: Request) {
  const secret = req.headers.get('X-Webhook-Secret') ?? ''
  const expectedSecret = Deno.env.get('FORMS_WEBHOOK_SECRET') ?? ''
  if (!expectedSecret || secret !== expectedSecret) {
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
  if (connectionError) return jsonResponse({ error: connectionError.message }, 500)
  if (!connection) return jsonResponse({ error: 'Nenhum formulário conectado com esse id' }, 404)

  const { error: dedupeError } = await supabase
    .from('form_response_events')
    .insert({ connection_id: connection.id, response_id: body.responseId })
  if (dedupeError) {
    if (dedupeError.code === '23505') return jsonResponse({ ok: true, duplicate: true })
    return jsonResponse({ error: dedupeError.message }, 500)
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
  if (alertError) return jsonResponse({ error: alertError.message }, 500)

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
    if (req.method === 'POST' && url.pathname.endsWith('/sync')) return await handleSync(req)
    if (req.method === 'POST' && url.pathname.endsWith('/forms-webhook')) return await handleFormsWebhook(req)
    return jsonResponse({ error: 'Rota não encontrada. Use /connect, /callback, /sync ou /forms-webhook.' }, 404)
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Erro inesperado' }, 500)
  }
})
