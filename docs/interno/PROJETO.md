# Ametista Conversões — Documento do Projeto

> Criado em 2026-08-27, a pedido do usuário, como material de apoio pra uma última inspeção geral antes de colocar o app no ar. Reúne onde encontrar cada coisa, o estado atual, e uma auditoria de possíveis bugs/riscos encontrados lendo o código — não é um documento gerado automaticamente, foi checado item a item.

## 1. Onde estão as informações

**Código-fonte e histórico completo (git):**
- Repositório remoto: `https://github.com/ametista-conversoes/Ametista-Convers-es-app.git`
- Pasta local: `c:\Users\Local user\Desktop\Ametista App`
- Branch de trabalho: `master` (é também a branch principal — não há outras branches em uso)
- Todo o histórico de mudanças está nos commits (`git log`) — cada commit corresponde a uma sub-fase concluída e testada, com mensagem descrevendo o que mudou

**Progresso e decisões (`TASKS.md`, raiz do projeto):**
- Checklist cronológico de **18 fases**, da Fase 1 (fundação visual) até a Fase 18 (relatórios e Health Score) — tudo com `[x]` marcado conforme concluído e testado
- É o registro mais confiável de "o que já foi feito e testado" — mais granular que este documento
- Contém também, perto do fim, o levantamento completo dos 23 pedidos que o usuário trouxe depois dos primeiros testes reais (Fases 12–18), com a razão de cada decisão de escopo

**Regras do projeto e especificação (`CLAUDE.md`, raiz do projeto):**
- Stack obrigatório, sistema de design (cores, fontes, componentes), estrutura de rotas, papéis (RBAC) e as 16 entidades principais do banco
- É a fonte da verdade pra "como o app deveria se comportar" — este documento não repete o que já está lá, só referencia

## 2. O que é o app, em resumo

Plataforma de gestão para agências de marketing de performance, com dois portais (Cliente e Gestor). Detalhes completos — entidades, papéis, rotas — estão no `CLAUDE.md`. Stack: React 18 + TypeScript + Vite, Tailwind + shadcn/ui, Supabase (Postgres + Auth + Storage + Edge Functions) com Row Level Security em todas as tabelas.

## 3. Design

Sistema de design está 100% especificado no `CLAUDE.md` (tabela de cores em HSL/hex, tipografia, raio de borda, padrão de cards/botões/badges). Tema escuro permanente, sem alternância — decisão de produto, não uma lacuna.

## 4. Estado atual

Todas as 18 fases do roadmap estão concluídas e testadas ao vivo (ver `TASKS.md` pra detalhe fase a fase). Os dois portais estão funcionais: dashboard, performance/relatórios, projetos, tarefas, arquivos (com áudio), comentários (estilo WhatsApp, com áudio), reuniões, Cassie IA (4 modos), configurações no lado do cliente; dashboard executivo, clientes, kanban, workflows, incidentes, ativos digitais, integrações (Google Ads/Meta Ads/Google Forms), públicos-alvo, timeline, metas SMART e onboarding no lado do gestor.

**Pendência conhecida e aceita**: upload de arquivo grande (200MB–1,5GB) continua bloqueado até o usuário assinar o Supabase Pro — decisão já tomada, não é um bug (`TASKS.md`, item 16).

## 5. Auditoria — possíveis bugs e riscos antes de ir ao ar

Encontrados lendo o código (dois agentes de investigação, um focado em backend/segurança e outro em frontend/consistência, mais checagem própria) e confirmados um a um antes de entrar aqui — nada especulativo. Organizados por prioridade. Números de linha refletem o estado do código em 2026-08-27; se o arquivo mudar, procure pelo nome da função/hook citado.

### 🔴 Alto — vale corrigir antes ou logo depois do lançamento

**KPIs financeiros do cliente não vêm da sincronização real.** `src/lib/metrics.ts` (`aggregateProjectKpis`, `averageCtr`) lê de `projects.spend/revenue/roas/cpa/ctr` — colunas que **não têm nenhuma tela no app pra serem preenchidas** (nem na criação nem na edição de projeto, confirmado por busca no código inteiro). Na prática, os cards "Investimento", "Receita", "ROAS", "CPA", "CTR médio" no Dashboard e em Relatórios mostram R$ 0,00/— pra qualquer cliente real, mesmo com Google Ads ou Meta Ads conectado e sincronizando de verdade em `performance_snapshots`. Os novos cards de tráfego (Impressões, Cliques, CPC, Taxa de Conversão, adicionados na Fase 18) já leem do lugar certo — o problema é só nos cards mais antigos. Achado e detalhado na conversa que fechou a Fase 18.

### 🟡 Médio — vale corrigir, sem bloquear o lançamento

- **Mensagens de erro internas vazando pro cliente.** `supabase/functions/cassie/index.ts` e `supabase/functions/integrations/index.ts` devolvem `error.message` bruto do Postgres/OpenAI/Google/Meta direto pra quem chamou (mais de 15 pontos no código). Isso pode expor nome de coluna/constraint ou corpo de erro de API terceira pro navegador do usuário. Ideal: logar o erro detalhado no servidor e devolver uma mensagem genérica.
- **Rotas do Portal Cliente sem checagem de papel no roteador.** Em `src/App.tsx`, as rotas de `clientNavItems` (`/project`, `/tasks`, `/files`, `/cassie`, etc.) só passam por `ProtectedRoute` (qualquer um logado), não por um `RoleRoute` restringindo a `role === 'cliente'`. Hoje isso não vaza dado (admin/gestor têm `clientId` nulo e a página fica vazia), mas é frágil — qualquer página nova que não trate `clientId` nulo com cuidado quebraria essa proteção. Vale um `RoleRoute` explícito por defesa em profundidade.
- **~10 mutations sem feedback de erro pro usuário.** Um padrão sistemático: `useClearCassieHistory`, `useUpdateClientStatus`, `useUpdateTaskStatus`, `useToggleActivityChecklistItem`, `useSetDefaultActivityTemplate`/`useUnsetDefaultActivityTemplate`, `useUpdateDigitalAssetStatus` (todas em `useManagerPortalData.ts`/`useCassieMessages.ts`) não têm `onError`. Se a mutation falhar (RLS, rede), o botão/checkbox só volta ao estado anterior sem nenhum toast explicando — o usuário não entende o que aconteceu. Outras mutations do próprio projeto (`useCassieMessages.ts:52-55`, `usePersuasiveCopyMessages.ts`, `useManagerAvailability.ts`) já mostram o padrão certo de comparação, com `onError` + toast.
- **Erro de busca de dados não é distinguido de "sem dados ainda".** `Dashboard.tsx`, `Reports.tsx`, `Project.tsx` e `ClientDetail.tsx` só checam `isLoading`, nunca `isError` — se a query falhar, os cards mostram zero/"—" exatamente como um cliente novo sem dado nenhum, sem nenhum aviso de que algo deu errado.
- **Taxa de Conversão não é 100% comparável entre Google Ads e Meta Ads.** Já documentado em comentário no próprio código (`integrations/index.ts`): o Google reporta `metrics.conversions` (métrica configurada na conta); o Meta não tem esse número pronto, então o código soma o valor de **todas** as entradas de `actions[]` (que inclui engajamento, visualização de vídeo, etc., não só conversão de verdade) como aproximação. Um cliente só no Meta pode aparecer com taxa de conversão inflada frente a um só no Google — não é um bug de cálculo, é uma limitação da própria API do Meta, mas vale ter isso em mente ao comparar clientes de plataformas diferentes.

### 🟢 Baixo — sem urgência, bom pra uma limpeza futura

- Comparação de segredo (`X-Cron-Secret`/`X-Notifications-Secret`/`X-Webhook-Secret` em `integrations/index.ts` e `notifications/index.ts`) usa `!==` simples em vez de comparação em tempo constante — risco teórico de timing attack, correção de uma linha.
- `handlePersuasiveCopy` (`cassie/index.ts`) não confere se o `client_id` recebido existe de verdade antes de consultar — hoje só resulta numa resposta vazia, não num erro real.
- Código morto confirmado (nenhum outro arquivo importa): `useCreateMeeting`/`NewMeetingInput` em `useClientPortalData.ts:355-374`, e o componente `IncidentList` (`src/components/incidents/IncidentList.tsx`) — substituído por `IncidentAlertList` mas nunca removido.
- `fetchLatestUpdatedAt`/`latestOf` (helpers do indicador de "não visto" no menu) estão duplicados palavra-por-palavra entre `useClientPortalData.ts` e `useManagerPortalData.ts` — um ajuste futuro num precisa lembrar de replicar no outro.

### Checado e sem problema (pra registro — não precisa reconferir)

RLS está habilitado e correto em toda tabela com `client_id`; o bug de política "só gestor, esqueceu admin" (corrigido na Fase 12 pra reuniões) não se repete em nenhuma outra política; nenhuma chave/segredo real está commitada no repositório; CORS das Edge Functions está travado no domínio de produção da Vercel (não `*`); não há tela piscando conteúdo indevido antes de um redirecionamento de papel.

## 6. Ideias e próximos passos sugeridos

Em ordem de valor prático, não de facilidade:

1. **Ligar Investimento/CPA/CTR médio à sincronização real** (resolve o achado 🔴) — quando o projeto tiver uma campanha vinculada ou o cliente tiver integração conectada, calcular a partir de `performance_snapshots`/`campaign_performance_snapshots` em vez das colunas estáticas de `projects`; manter fallback manual só pra quem não tem integração.
2. **Dar um jeito de registrar Receita manualmente.** Nenhuma plataforma de anúncio reporta faturamento — hoje nem existe tela pra digitar isso à mão. Sem isso, ROAS/Lucro reais nunca vão bater, integração ou não.
3. **Padronizar tratamento de erro nas mutations** — um wrapper compartilhado em cima de `useMutation` que já inclui `onError` com toast genérico por padrão (sobrescrevível quando precisar de algo específico), pra não depender de lembrar em cada hook novo.
4. **Monitoramento de erro em produção** (ex: Sentry) — hoje, se algo quebrar pra um usuário real, a única forma de saber é ele reportar manualmente. Especialmente importante logo após o lançamento.
5. **Confirmar backup automático do banco** no plano Supabase escolhido (Pro inclui; Free não tem backup diário confiável) — checar antes de ter dado de cliente real.
6. **Política de privacidade / termos de uso**, dado que o app guarda dado real de cliente (nome, e-mail, financeiro) e o público é brasileiro (LGPD) — isto é uma recomendação de processo, não uma constatação encontrada no código; vale checar com quem cuida da parte jurídica.

## 7. Checklist final antes de colocar no ar

- [ ] Ler o `TASKS.md` do início ao fim pelo menos uma vez, além deste documento
- [ ] Decidir, dos achados 🔴/🟡 da seção 5, quais corrigir antes do lançamento e quais aceitar por ora
- [ ] Confirmar que as variáveis de ambiente de produção (Vercel + Supabase) apontam pro projeto certo, não pro de teste
- [ ] Se o domínio final for diferente de `https://ametistaconversoesapp.vercel.app`, atualizar `corsHeaders` em `supabase/functions/cassie/index.ts` e `supabase/functions/integrations/index.ts` (senão o chat da Cassie e as sincronizações de integração param de funcionar por CORS)
- [ ] Testar login e uma tarefa de cada papel (admin, gestor, cliente) direto em produção, não só local
- [ ] Assinar Supabase Pro antes de liberar upload de arquivo grande (item 16 do roadmap, `TASKS.md`)
