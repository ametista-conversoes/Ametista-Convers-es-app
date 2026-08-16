// Ametista Conversões — Fase 7.1: Cassie IA (chat do portal do
// cliente, via API da OpenAI).
//
// Como usar: cole este arquivo inteiro no painel do Supabase, em
// Edge Functions > "cassie" > editar código > Deploy. A verificação
// automática de JWT precisa estar DESLIGADA nas configurações da
// função (Edge Functions > cassie > Settings) — mesmo que só o nosso
// próprio front-end chame essa rota, o navegador manda um pedido
// "preflight" (OPTIONS) sem o token de login antes da chamada de
// verdade, e o Supabase bloqueia esse preflight se a verificação
// automática estiver ligada. A autenticação de quem chama já é feita
// na mão aqui dentro (ver `requireClient`), igual a função
// "integrations" já faz.
//
// Segredo que essa função espera encontrar configurado (Edge
// Functions > cassie > Secrets), além dos que o Supabase já injeta
// sozinho em toda função (SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY):
//   Openai_api_key — gerada em platform.openai.com, colada direto aqui
//                     (nunca no código, nunca no chat com o Claude).
//                     Nome com essa grafia específica porque o painel do
//                     Supabase não deixa renomear um segredo depois de
//                     criado — o padrão do resto do projeto é
//                     MAIÚSCULO_COM_UNDERSCORE, mas esse aqui ficou assim.
//
// Rota:
//   POST .../cassie/chat   { message: string }

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const OPENAI_MODEL = 'gpt-5-mini' // linha "mini", mais barata — trocar aqui se quiser subir de modelo depois
const HISTORY_LIMIT = 20 // últimas mensagens incluídas como contexto, pra não deixar a conversa cara conforme cresce

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

function getServiceClient() {
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
}

async function requireClient(req: Request): Promise<{ userId: string; clientId: string } | Response> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return jsonResponse({ error: 'Não autenticado' }, 401)

  const anonClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '')
  const { data: userData, error: userError } = await anonClient.auth.getUser(token)
  if (userError || !userData.user) return jsonResponse({ error: 'Sessão inválida' }, 401)

  const supabase = getServiceClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, client_id')
    .eq('id', userData.user.id)
    .single()
  if (profileError || !profile) return jsonResponse({ error: 'Perfil não encontrado' }, 403)
  if (profile.role !== 'cliente' || !profile.client_id) {
    return jsonResponse({ error: 'Não autorizado' }, 403)
  }
  return { userId: userData.user.id, clientId: profile.client_id as string }
}

const SYSTEM_PROMPT_BASE = `Você é a Cassie, a assistente de IA da Ametista Conversões, uma agência de marketing de performance.
Você conversa com o CLIENTE da agência (não com a equipe interna), dentro do portal dele.
Responda sempre em português do Brasil, de forma clara e direta.
Você pode: explicar o desempenho e os dados reais do cliente (usando o resumo fornecido abaixo), sugerir otimizações com base nesses dados, tirar dúvidas gerais sobre marketing digital/performance, e redigir ou resumir relatórios em texto a partir dos dados fornecidos.
Não invente números — use só os dados do resumo abaixo; se não tiver o dado, diga que não tem essa informação.
Não fale sobre outros clientes da agência, nem sobre assuntos sem relação com marketing/desempenho/a conta do cliente.`

interface ClientContextRow {
  name: string
  company: string | null
  plan: string | null
  health_score: number | null
}

async function buildClientContext(supabase: SupabaseClient, clientId: string): Promise<string> {
  const [{ data: client }, { data: projects }, { data: tasks }, { data: snapshots }] = await Promise.all([
    supabase.from('clients').select('name, company, plan, health_score').eq('id', clientId).single(),
    supabase
      .from('projects')
      .select('title, status, cpa, roas, ctr, spend, revenue, channel')
      .eq('client_id', clientId),
    supabase.from('tasks').select('title, status, due_date, priority').eq('client_id', clientId).neq('status', 'done'),
    supabase
      .from('performance_snapshots')
      .select('spend, revenue, roas, ctr')
      .eq('client_id', clientId)
      .gte('snapshot_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
  ])

  const c = client as ClientContextRow | null
  const lines: string[] = []

  lines.push(`Cliente: ${c?.name ?? 'desconhecido'}${c?.company ? ` (${c.company})` : ''}`)
  lines.push(`Plano: ${c?.plan ?? 'não informado'} · Health score: ${c?.health_score ?? 'não informado'}`)

  if (projects && projects.length > 0) {
    lines.push('\nProjetos:')
    for (const p of projects) {
      lines.push(
        `- "${p.title}" (${p.status}, canal: ${p.channel ?? 'não informado'}) — CPA: ${p.cpa ?? '—'}, ROAS: ${p.roas ?? '—'}, CTR: ${p.ctr ?? '—'}, gasto: ${p.spend ?? '—'}, receita: ${p.revenue ?? '—'}`,
      )
    }
  } else {
    lines.push('\nSem projetos cadastrados.')
  }

  const today = new Date().toISOString().slice(0, 10)
  const openTasks = (tasks ?? []).filter((t) => !t.due_date || t.due_date >= today)
  const overdueTasks = (tasks ?? []).filter((t) => t.due_date && t.due_date < today)
  lines.push(`\nTarefas em aberto: ${openTasks.length}. Tarefas atrasadas: ${overdueTasks.length}.`)
  if (overdueTasks.length > 0) {
    lines.push('Atrasadas: ' + overdueTasks.map((t) => `"${t.title}"`).join(', '))
  }

  if (snapshots && snapshots.length > 0) {
    const totalSpend = snapshots.reduce((sum, s) => sum + (s.spend ?? 0), 0)
    const totalRevenue = snapshots.reduce((sum, s) => sum + (s.revenue ?? 0), 0)
    const withRoas = snapshots.filter((s) => s.roas != null)
    const avgRoas = withRoas.length > 0 ? withRoas.reduce((sum, s) => sum + (s.roas ?? 0), 0) / withRoas.length : null
    const withCtr = snapshots.filter((s) => s.ctr != null)
    const avgCtr = withCtr.length > 0 ? withCtr.reduce((sum, s) => sum + (s.ctr ?? 0), 0) / withCtr.length : null
    lines.push(
      `\nÚltimos 30 dias: gasto total ${totalSpend.toFixed(2)}, receita total ${totalRevenue.toFixed(2)}, ROAS médio ${avgRoas?.toFixed(2) ?? '—'}, CTR médio ${avgCtr?.toFixed(2) ?? '—'}.`,
    )
  } else {
    lines.push('\nSem dados de desempenho sincronizados nos últimos 30 dias.')
  }

  return lines.join('\n')
}

function extractReplyText(data: { output?: Array<{ type: string; role?: string; content?: Array<{ type: string; text?: string }> }> }): string {
  const messages = (data.output ?? []).filter((item) => item.type === 'message' && item.role === 'assistant')
  const parts: string[] = []
  for (const message of messages) {
    for (const block of message.content ?? []) {
      if (block.type === 'output_text' && block.text) parts.push(block.text)
    }
  }
  return parts.join('\n').trim()
}

async function handleChat(req: Request) {
  const auth = await requireClient(req)
  if (auth instanceof Response) return auth

  let body: { message?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo inválido' }, 400)
  }
  const message = body.message?.trim()
  if (!message) return jsonResponse({ error: 'message é obrigatório' }, 400)

  const openaiKey = Deno.env.get('Openai_api_key')
  if (!openaiKey) {
    return jsonResponse({ error: 'A chave da OpenAI ainda não foi configurada nesta função (falta o segredo Openai_api_key).' }, 400)
  }

  const supabase = getServiceClient()

  const [contextText, { data: history, error: historyError }] = await Promise.all([
    buildClientContext(supabase, auth.clientId),
    supabase
      .from('cassie_messages')
      .select('role, content')
      .eq('client_id', auth.clientId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT),
  ])
  if (historyError) return jsonResponse({ error: historyError.message }, 500)

  const orderedHistory = [...(history ?? [])].reverse()

  const { error: insertUserError } = await supabase
    .from('cassie_messages')
    .insert({ client_id: auth.clientId, role: 'user', content: message })
  if (insertUserError) return jsonResponse({ error: insertUserError.message }, 500)

  const openaiRes = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: `${SYSTEM_PROMPT_BASE}\n\n--- Dados do cliente ---\n${contextText}`,
      input: [...orderedHistory.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: message }],
    }),
  })
  const openaiBody = await openaiRes.json()
  if (!openaiRes.ok) {
    return jsonResponse({ error: openaiBody.error?.message ?? 'Erro ao consultar a API da OpenAI' }, 502)
  }

  const replyText = extractReplyText(openaiBody)
  if (!replyText) return jsonResponse({ error: 'A Cassie não conseguiu gerar uma resposta.' }, 502)

  const { error: insertReplyError } = await supabase
    .from('cassie_messages')
    .insert({ client_id: auth.clientId, role: 'assistant', content: replyText })
  if (insertReplyError) return jsonResponse({ error: insertReplyError.message }, 500)

  return jsonResponse({ reply: replyText })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)

  try {
    if (req.method === 'POST' && url.pathname.endsWith('/chat')) return await handleChat(req)
    return jsonResponse({ error: 'Rota não encontrada. Use /chat.' }, 404)
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Erro inesperado' }, 500)
  }
})
