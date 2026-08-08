# Ametista Conversões — Checklist do Projeto

> Trabalhamos **uma fase por vez**. Cada fase só começa depois que a anterior for aprovada.

## Fase 1 — Fundação visual
- [x] Inicializar o projeto (Vite + React + TypeScript)
- [x] Configurar o Tailwind com os tokens de cor exatos do `CLAUDE.md`
- [x] Configurar a fonte Inter
- [x] Criar o `AppLayout` (Sidebar fixa no desktop / menu retrátil no celular + TopBar fixa + área principal responsiva)
- [x] Criar a Sidebar com os itens de navegação do Portal Cliente e Portal Gestor (dados fixos por enquanto)
- [x] Aplicar os estilos de card, botão e badge conforme o `CLAUDE.md`

## Fase 2 — Autenticação e permissões (RBAC)
- [x] Configurar projeto no Supabase (autenticação + banco) e explicar como criar a conta e pegar as chaves de API
- [x] Criar páginas de Login, Registro, Esqueci a senha e Redefinir senha
- [x] Criar o `ProtectedRoute` (bloqueia quem não está logado)
- [x] Criar o `RoleRoute` (bloqueia usuários `cliente` de acessarem rotas do Portal do Gestor)
- [x] Ligar a Sidebar para mostrar apenas as seções do papel do usuário logado
- [x] Testado com as 3 contas de teste (`admin`, `gestor`, `cliente`) pelo usuário — todos os critérios de aceite confirmados

## Fase 3 — Entidades e banco de dados
- [x] Criar as 16 entidades listadas no `CLAUDE.md`, com campos e relacionamentos corretos
- [x] Configurar Row Level Security (cliente só vê os próprios dados)
- [x] Popular dados de teste (seed) para visualização
- [x] Testado com verificação automática de segurança (9 testes: anônimo, cliente e admin) — todos os critérios de aceite confirmados

## Fase 4 — Portal do Cliente (detalhada em `Prompt fase 4.txt`)

### Fase 4.1 — Dashboard e Performance
- [x] Dashboard (`/`): KPIs, Health Score expansível (4 sub-notas), reuniões, tarefas, resumo financeiro, metas, notificações, botão Pausa de Emergência
- [x] Performance (`/performance`): métricas em 3 categorias, gráfico de barras (canal) e gráfico de linha (tendência)
- [x] Testado com dados reais do Supabase, incluindo o gráfico mudando ao editar um valor no banco, e responsividade nas larguras problemáticas (iPad Air ~820px, Zenbook Fold ~853px)

### Fase 4.2 — Relatórios e Meu Projeto
- [x] Relatórios (`/reports`): 4 abas (Performance de Tráfego, Financeiro, Distribuição & Canais, Clientes & Mensalidades)
- [x] Meu Projeto (`/project`): info cards, cronograma, checklist de onboarding, metas SMART, lista de tarefas
- [x] Testado com dados reais do Supabase, incluindo marcar/desmarcar uma etapa do onboarding e navegação entre as 4 abas, e responsividade nas larguras problemáticas (iPad Air ~820px, Zenbook Fold ~853px)

### Fase 4.3 — Tarefas, Arquivos, Comentários e Reuniões
- [x] Tarefas (`/tasks`): lista com filtro, nova tarefa, toggle de conclusão
- [x] Arquivos (`/files`): abas Arquivos e Aprovações, upload, aprovar/rejeitar/pedir revisão
- [x] Comentários (`/comments`): feed com novo comentário
- [x] Reuniões (`/meetings`): agendar, lista com status
- [x] Testado com dados reais do Supabase: criar tarefa e concluir, subir e abrir arquivo, aprovar uma aprovação, enviar comentário (com nome/papel), agendar reunião, e responsividade nas larguras problemáticas (iPad Air ~820px, Zenbook Fold ~853px)
- [x] Ajustes pós-teste: trava de data passada em tarefas e reuniões, popup de detalhes da tarefa com campo de descrição, seletor de horário pré-definido nas reuniões, título nos comentários, e novas aprovações de exemplo em "Pendente"
- [x] Mais ajustes: menu de horário reescrito com Radix Select (altura limitada, cores do design system — corrigido também um bug real do `--popover` que deixava menus suspensos transparentes), arquivos categorizados por tipo com prévia de imagem/vídeo (sem o selo de aprovação, que confundia com a aba Aprovações), e menu de status da tarefa (Backlog/A fazer/Em andamento/Em revisão) direto no badge

### Fase 4.4 — Configurações
- [x] Configurações (`/settings`): abas Globais/Agência/Cliente/Usuário filtradas por papel (Globais só admin; Agência admin/gestor; Cliente e Usuário para todos)
- [x] Aba Usuário: editar nome/telefone (salva de verdade) e botão Sair
- [x] Corrigido: "Configurações" agora aparece no menu lateral para o papel `gestor` também (antes só existia para `cliente`/`admin`)
- [x] Testado com 3 contas de teste (`cliente`, `gestor`, `admin`) — abas corretas por papel, edição de perfil persistindo, e logout funcionando

## Fase 5 — Portal do Gestor

### Fase 5.1 — Dashboard Executivo e Clientes
- [x] Dashboard Executivo (`/admin`): 8 KPI cards (MRR Total, Clientes Ativos, Churn Rate, Incidentes Abertos, Clientes em Risco, Carga de Trabalho, Produtividade, Budget Gerenciado), gauge de produtividade, lista de clientes em risco, lista de incidentes abertos recentes
- [x] Clientes (`/clients`): busca por nome/empresa, dialog "Novo Cliente", grid de cards com health score e cor por status
- [x] Testado logado como `admin`: os 8 KPIs batem com os dados de teste, criar cliente novo aparece na hora no grid com a cor certa; testado logado como `cliente`: `/admin` redireciona com "Acesso Negado" (regressão da Fase 2 confirmada)
- [x] Melhoria de UX (pedida pelo usuário): ícone de dúvida nos cards de KPI (`KpiCard`) mostrando fórmula/descrição ao passar o mouse — aplicado nos 8 KPIs do Dashboard Executivo e retroativamente no Dashboard, Performance e Relatórios do Portal Cliente (mesmo componente reaproveitado nos 4 lugares)

### Fase 5.2 — Kanban e Workflows
- [x] Kanban (`/kanban`): 5 colunas (Backlog/A fazer/Em andamento/Em revisão/Concluída — os mesmos valores de status das tarefas), arrastar e soltar com `@dnd-kit` (dependência nova, autorizada), filtro por cliente, botão "Nova tarefa"
- [x] Workflows (`/workflows`): 4 modelos fixos (Novo Cliente, Nova Campanha, Produção de Criativos, Configuração de Pixel), botão "Aplicar Workflow" com seleção de projeto — cria várias tarefas de uma vez, todas em Backlog
- [x] Testado: arrastar um card e recarregar a página confirma que o status salvou de verdade; aplicar um workflow cria as tarefas no Kanban E elas aparecem na página Tarefas do cliente dono do projeto (Fase 4.3); testado logado como `cliente`: `/kanban` e `/workflows` continuam bloqueados (regressão da Fase 2)
- [x] Ajustes de UI pós-teste: colunas do Kanban ganharam altura fixa com rolagem própria (a barra de rolagem horizontal do quadro não fica mais lá embaixo da página) — e corrigido um bug real encontrado no caminho: `overflow-x: hidden` duplicado em `html` **e** `body` quebrava o `position: sticky` da sidebar em páginas altas, fazendo a cor de fundo "sumir" ao rolar (removido do `body`, mantido só no `html`)

### Fase 5.3 — Incidentes, Alertas e Timeline
- [x] Incidentes (`/incidents`): novo incidente, contagem por severidade, resolução via dialog — e `/status` mostrando o mesmo conteúdo
- [x] Alertas (`/alerts`): novo alerta, seção de ativos e de resolvidos
- [x] Timeline (`/timeline`): lista de eventos com ícone e severidade
- [x] Registro automático de eventos na Timeline via trigger no banco (não depende do código do front): criar/resolver incidente, criar/resolver alerta, aplicar workflow — todos gravam sozinhos em `audit_logs`
- [x] Botão "Pausa de Emergência" do Portal Cliente (Fase 4.1) conectado de verdade: cria um incidente crítico (via RPC `trigger_emergency_pause`) que aparece automaticamente em Incidentes e na Timeline do Portal Gestor — confirmando que os dois portais estão conectados
- [x] Testado: incidente/alerta de teste aparecem na Timeline na hora certa (criação e resolução); Pausa de Emergência do cliente gera o incidente crítico automaticamente; `/status` espelha `/incidents`; regressão confirmada (`cliente` continua bloqueado em `/incidents`, `/alerts`, `/timeline`)
- [x] Ajustes de UX/responsividade pós-teste (pedidos pelo usuário, valem para os dois portais):
  - Pausa de Emergência ganhou campo de motivo + lista de campanhas ativas com checkbox — agora pausa de verdade os projetos escolhidos (`status = paused`) além de abrir o incidente crítico
  - Ícone de dúvida dos KPIs trocou de `Tooltip` (hover) para `Popover` (clique) — no celular, tocar não fazia sentido com hover e "sumia" a métrica; agora abre ao tocar e fica até tocar de novo ou tocar fora
  - Kanban: sensor de arrastar do `@dnd-kit` separado em mouse (imediato) e toque (segura ~200ms) — corrige o celular não deixar rolar o quadro pro lado
  - `SelectContent` (menus como o de horário) e `TabsList` (abas de Relatórios) ganharam largura/rolagem travada — não esticavam mais que o campo/página em telas estreitas
  - Campo "Data" (Nova Tarefa, Agendar Reunião) trocou o seletor numérico nativo por um calendário de verdade (`react-day-picker` + Popover), componente pronto para reaproveitar nas próximas fases
  - Fileira "Data + Horário" do formulário de reunião empilha em telas estreitas em vez de espremer

- [x] Ajustes pós-teste adicionais (pedidos pelo usuário):
  - Workflows (Portal Gestor) deixaram de ser fixos no código: agora moram no banco (`workflow_templates`), e só a conta `admin` vê o botão "Novo modelo" para criar e estruturar modelos novos (nome, descrição, lista de etapas) — `gestor` continua podendo aplicar os modelos existentes, mas não criar
  - Kanban: diálogo "Nova tarefa" ganhou o campo "Prazo (opcional)" com o mesmo calendário (`DatePicker`) já usado no Portal Cliente
  - Ícones de dúvida dos KPIs: só uma dica fica aberta por vez em toda a tela (estado compartilhado entre os cards) — abrir uma fecha a anterior automaticamente

### Fase 5.4 — Ativos Digitais, Metas SMART e Onboarding
- [x] Ativos Digitais (`/assets`): filtro por cliente, "Novo ativo" (nome, cliente, tipo, plataforma, status), badge de status trocável na hora (dropdown)
- [x] Metas SMART (`/smart-goals`): filtro por cliente, "Nova meta" (título, cliente, métrica, valor alvo/atual, período, status), botão "Atualizar progresso" por meta com barra de progresso
- [x] Onboarding (`/onboarding`): visão agrupada por cliente (um card com barra de progresso + checklist por cliente), "Nova etapa" (título, cliente, projeto opcional, categoria), reaproveita o mesmo toggle de concluído/pendente do Portal Cliente
- [x] Testado logado como `gestor`: criar ativo e trocar status pelo badge, criar meta e atualizar progresso (barra reflete na hora), criar etapa de onboarding e marcar como concluída — tudo refletindo direto no banco; as 3 páginas usam o mesmo `RoleRoute` das demais telas do Portal Gestor, então o bloqueio para `cliente` já estava garantido (nenhum arquivo do Portal Cliente foi alterado)
- [x] Ajustes pós-teste (pedidos pelo usuário):
  - Ativos Digitais: tipos com link de acesso (conta de anúncios, Business Manager, domínio) ganharam campo de link clicável; pixel e tag (novo tipo) ganharam campo de código/snippet no lugar do link
  - Metas SMART: período virou um calendário de prazo único (`target_date`); métrica virou uma lista categorizada (CPA, ROAS, CPC, CTR, CPM, Leads, Conversões, Faturamento, Ticket Médio, Taxa de Conversão) com opção "Outro" pra digitar; cada card ganhou um selo automático de urgência (Atrasada/Urgente/Imediato, calculado a partir do prazo) e a página ganhou um ícone de informação único (não repetido por card) explicando as 3 faixas
  - Corrigido bug real: uma etapa de onboarding criada pelo gestor sem projeto vinculado nunca aparecia no checklist do Portal Cliente (o filtro só considerava o projeto atual) — agora etapas gerais do cliente (sem projeto específico) aparecem também
  - Nova aba "Comentários" no Portal Gestor (`/client-comments`): escolhe um cliente e vê/responde os comentários dele em formato de chat (cliente à esquerda, agência à direita) — usa o mesmo mural que já existia no Portal Cliente, só que visto do outro lado; os dois portais ganharam um botão "Regras de uso" explicando o padrão de título com `[tópico]` entre colchetes (só orientação, não bloqueia o envio)
- [x] Mais uma rodada de ajustes (pedidos pelo usuário):
  - **Status do cliente editável**: o badge de status em Clientes agora é um menu (mesmo padrão de Tarefas) — inclui o novo status manual "Em risco" (vermelho)
  - **Indicadores automáticos de risco**: Health Score no card de cliente ganhou cor (verde/laranja/vermelho conforme o valor); novo badge automático "Em problemas" (laranja) calculado sozinho quando o cliente tem meta SMART atrasada, 2+ incidentes médios (ou 1+ alto/crítico) abertos, 4+ tarefas atrasadas em algum projeto, ou 2+ alertas médios (ou 1+ alto/crítico) não resolvidos
  - **Apagar itens**: ícone de lixeira (liga um "modo de exclusão") ao lado do título em Clientes (só `admin`), Workflows (só `admin`), Incidentes, Ativos Digitais, Alertas, Metas SMART, Onboarding, e nas telas de Tarefas e Arquivos do Portal Cliente — cada card ganha seu próprio ícone de apagar com confirmação; no Kanban o modo revela uma zona de lixeira pra arrastar o card (com animação), em vez de um ícone por card
  - **Reuniões com fluxo de cancelamento**: cancelar uma reunião (cliente ou gestor) agora pede um motivo e marca como "Cancelada" (não apaga na hora) — só depois de cancelada é que a outra parte consegue apagá-la de vez, garantindo que os dois lados saibam o porquê antes dela sumir; nova aba "Reuniões" no Portal Gestor (`/client-meetings`) que antes não existia — o gestor agora vê as reuniões marcadas pelos clientes e também pode marcar reuniões novas
- [x] Mais dois ajustes (pedidos pelo usuário):
  - Corrigido bug real: a zona de lixeira do Kanban ficava dentro da mesma fileira rolável das 5 colunas, então em telas comuns ela ficava fora da área visível — parecia "lento"/exigir várias tentativas porque o card sempre era solto antes de rolar até ela. Agora é uma faixa larga abaixo do quadro, sempre visível, sem precisar rolar
  - Aba Agência (Configurações) virou editável — o próprio código já tinha um aviso "isso chega no Portal do Gestor (Fase 5)" desde a Fase 4, nunca implementado; agora `admin`/`gestor` editam nome, plano, status e domínio da agência (a política do banco já liberava os dois papéis, só faltava o formulário)
- [x] Ajuste fino na lixeira do Kanban: a exclusão dependia de acertar exatamente a faixa fina da lixeira no instante de soltar o card (`onDragEnd`) — tentativa de apagar assim que o card **entra** na área da lixeira durante o arrasto (`onDragOver`), sem precisar soltar o botão do mouse
- [x] Lixeira do Kanban trocada de vez pelo padrão de exclusão usado no resto do app: em vez de arrastar o card até uma zona de lixeira, o modo de exclusão (mesmo ícone de sempre) agora mostra um ícone de apagar em cada card, com confirmação — igual Clientes, Incidentes, Ativos Digitais etc. Arrastar fica desativado enquanto o modo está ligado, pra não misturar as duas ações
- [x] Rodada grande de melhorias (pedidas pelo usuário):
  - **Workflows editáveis e etapas reordenáveis**: modelos existentes agora têm botão "Editar" (só `admin`); as etapas podem ser arrastadas pra reordenar dentro do formulário (`@dnd-kit/sortable`, nova dependência aprovada) — não precisa mais apagar tudo pra corrigir a ordem
  - **Arquivos & Aprovações no Portal Gestor** (aba nova `/client-files`): o gestor agora consegue mandar arquivos direto pro cliente (sem aprovação) ou pra aprovação (fica pendente até o cliente decidir). Corrigido um buraco real: a função `respond_to_approval` só atualizava o status da aprovação e nunca fazia o arquivo aparecer em lugar nenhum — agora, ao aprovar, ela cria a entrada em Arquivos automaticamente, e isso aparece na hora nos dois portais (sem precisar recarregar a página)
  - **Central de Informações do Cliente**: clicar num card em Clientes agora leva pra uma página dedicada com logo (upload), telefone, data de renovação, observações internas (só a agência vê — nunca vai pro portal do cliente, confirmado por teste), e as tarefas/metas/reuniões daquele cliente reunidas num só lugar

> **Nota sobre a ordem das próximas fases:** ao terminar a Fase 5, a intenção é seguir para as integrações externas (Google Ads, Meta Ads, Google Forms) — hoje anotadas como "Fase 8" logo abaixo. A numeração final (se essa fase vira "Fase 6" e empurra as demais, ou fica como está) será decidida quando chegarmos lá; por enquanto nenhuma fase provisória foi apagada ou renumerada.

## Fase 6 — Recursos avançados / IA (provisório, detalhar quando chegar a vez)
- [ ] Funcionalidades da assistente Cassie (IA) e automações que dependerem dela

## Fase 7 — Acabamento, testes e publicação (provisório, detalhar quando chegar a vez)
- [ ] Testes automatizados (Vitest + Playwright)
- [ ] Revisão geral de responsividade e acessibilidade
- [ ] Preparar o app para publicação (deploy)

## Fase 8 — Integrações externas de dados (provisório, detalhar quando chegar a vez)
- [ ] Conectar dados reais de plataformas externas (Google Ads, Meta Ads, Google Forms, etc.) via Supabase Edge Functions, alimentando as mesmas tabelas que o app já lê hoje (sem precisar recriar as telas)
