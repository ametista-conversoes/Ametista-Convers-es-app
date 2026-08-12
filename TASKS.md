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

### Fase 5.5 — Central editável, planos fixos, reuniões recorrentes e notificações no menu
- [x] **Central de Informações editável**: nome, empresa (nome do negócio), e-mail, plano e mensalidade agora são editáveis (antes só telefone/renovação/observações eram); listas de Tarefas (até 10), Metas SMART (até 5) e Reuniões (até 10) ganharam rolagem interna em vez de esticar a página; novo card "Cliente em risco" (mesmo cálculo do badge "Em problemas" já existente, agora com o detalhamento — tarefas atrasadas, metas fora do prazo, alertas e incidentes abertos) que só aparece quando há algum problema de verdade
- [x] **Planos fixos**: viraram só 3 opções — Validação, Escala, Dominação — selecionáveis na criação do cliente e editáveis na Central (antes era texto livre sem nenhum padrão)
- [x] **Reuniões automáticas por plano**: botão "Configurar recorrência" em Reuniões (Portal Gestor) liga um cadastro por cliente que mantém sempre 3 reuniões futuras tituladas "Reunião" — frequência decidida pelo plano (Validação = mensal, Escala = quinzenal, Dominação = semanal); ao concluir uma reunião (novo botão "Concluir"), o sistema já cria a próxima pra repor
- [x] **Notificações no menu**: bolinha roxa ao lado de Comentários/Reuniões/Arquivos/Alertas/Incidentes/Kanban/Metas SMART (Portal Gestor) e Comentários/Tarefas/Arquivos/Reuniões (Portal Cliente) — acende quando há atividade nova (reunião, mensagem, arquivo, tarefa, aprovação decidida, alerta, meta, incidente) e some sozinha assim que a aba é visitada (nova tabela guardando a última visita de cada usuário a cada aba)
- [x] Testado ao vivo como `gestor`/`cliente` (migração rodada pelo usuário): campos editáveis da Central salvos e persistidos após recarregar; card "Cliente em risco" aparece só no cliente com pendência de verdade; planos fixos aparecem certinho no formulário de criação e na Central; recorrência de reuniões testada direto no banco — cadastrar um cliente com plano Escala criou 3 reuniões quinzenais "Reunião", e concluir uma repôs a próxima automaticamente, mantendo sempre 3; bolinha de notificação testada de ponta a ponta — comentário novo do gestor acende a bolinha na hora no Portal Cliente, visitar a aba apaga só aquela bolinha, sem afetar as outras

### Fase 5.6 — Busca em 5 abas + Ativos Digitais editáveis
- [x] **Busca**: caixa de busca (lupinha) nova em Kanban (por tarefa), Workflows (por modelo), Ativos Digitais (por nome/plataforma) e Timeline (por evento/cliente) — posicionada à esquerda do seletor de cliente ou do botão de criar; a busca de Clientes (nome/empresa) já existia e só mudou de lugar, pro mesmo padrão das outras
- [x] **Ativos Digitais editáveis**: antes só dava pra trocar o status (badge) ou apagar — agora um botão de editar (lápis) abre o mesmo formulário de criação já preenchido, deixando mudar nome, cliente, tipo, plataforma, link/código e status, no mesmo molde do editor de Workflows
- [x] Testado ao vivo como `gestor`: busca filtrando corretamente nas 5 abas (testei "não encontrado" e também um termo que bate com resultado real); editei um ativo existente (nome e plataforma), recarreguei a página e as mudanças persistiram

### Fase 5.7 — Tarefa atrasada acinzentada, ordenação por severidade/prazo, Kanban editável
- [x] **Tarefa atrasada acinzentada**: card do Kanban com prazo vencido (e status diferente de "Concluída") aparece visivelmente apagado (opacidade + leve dessaturação), padrão comum em CRMs
- [x] **Ordenação por severidade**: Incidentes e Alertas agora listam os mais severos primeiro (crítico → alto → médio → baixo)
- [x] **Ordenação por prazo**: Tarefas/Kanban e Metas SMART agora listam pelo prazo mais próximo primeiro — quem não tem prazo fica por último
- [x] **Tarefas do Kanban editáveis**: cada cartão ganhou um botão de editar (lápis, sempre visível) que abre o mesmo formulário de criação já preenchido — antes só dava pra arrastar entre colunas ou apagar
- [x] Testado ao vivo como `gestor`: criei incidentes/alertas com severidades diferentes e confirmei os mais críticos no topo; criei tarefas com prazos diferentes (uma atrasada) e confirmei a ordem por prazo e o card atrasado acinzentado; editei uma tarefa do Kanban (título/categoria), recarreguei e a mudança persistiu; confirmei que arrastar um card entre colunas continua funcionando normalmente depois de adicionar o botão de editar

> **Consolidação de numeração (feita ao iniciar a Fase 6, pedida pelo `Prompt- Fase 6`):** a antiga "Fase 8" (Integrações externas de dados) tratava do mesmo assunto deste documento, então foi incorporada aqui embaixo e deixou de existir como fase separada. A antiga Fase 6 (Cassie/IA) e a antiga Fase 7 (testes/publicação) foram unidas numa Fase 7 só, exatamente como o documento pediu ("ao terminar a Fase 6.4 ... seguir para a Fase 7 (C.A.S.S.I.E. e testes finais)").

## Fase 6 — Integrações com Google Ads, Meta Ads e Google Forms (detalhada no documento `Prompt- Fase 6`)

### Fase 6.1 — Fundação do backend de integrações
- [x] Backend de integrações: Edge Function `integrations` (`supabase/functions/integrations/index.ts`), publicada colando o código no painel do Supabase — mesmo fluxo zero-instalação já usado pra toda migração
- [x] Armazenamento seguro de tokens: em vez de guardar o valor criptografado direto numa coluna (tentativa inicial com `pgsodium` na mão esbarrou em "permission denied" nas funções de baixo nível), o token vai pro **Supabase Vault** — `oauth_tokens` guarda só o `id` (uuid) do segredo no Vault, nunca o valor; confirmado no Table Editor que a coluna mostra um uuid, não o token em texto
- [x] `performance_snapshots` estendida com `channel`, `clicks`, `impressions`, `conversions` (em vez de criar a `MetricSnapshot` do documento como tabela nova — decisão confirmada com o usuário) — Performance/Relatórios continuam lendo da mesma tabela de sempre
- [x] Estrutura genérica de OAuth: rotas `/connect` (gera a URL de autorização, reaproveitando a linha de conexão existente se já houver) e `/callback` (grava o token e marca a conexão como "connected"), reaproveitáveis por qualquer provedor — tabela nova `digital_asset_connections` (uma linha por Ativo Digital conectado a um provedor, só leitura pra admin/gestor)
- [x] Testado ao vivo via chamadas HTTP direto na função publicada: `/connect` devolve a URL de autorização e cria a conexão (`disconnected`); `/callback` grava o token no Vault e muda o status pra `connected`, confirmado direto no banco; corrigidos dois bugs reais no caminho — a URL de callback vinha fixa no código apontando pro nome errado da função (agora se monta sozinha a partir do path da requisição + `SUPABASE_URL`), e a criptografia via `pgsodium` direto não tinha permissão (trocada pelo Vault)

### Fase 6.2 — Conexão com Google (Ads e Forms)
- [x] Fluxo completo de OAuth com o Google: botão "Conectar integração" em Ativos Digitais (escolhe Google Ads ou Google Forms) → `/connect` monta a URL de autorização de verdade (escopo certo por provedor, `access_type=offline&prompt=consent` pra garantir refresh token) → `/callback` (aberta pelo navegador do Google) troca o código por token real e guarda no Vault
- [x] Conexão com a Google Ads API: `/callback` descobre a conta de anúncios acessível (`listAccessibleCustomers`) e grava; nova rota `/sync` busca investimento/cliques/impressões/conversões dos últimos 30 dias (GAQL) e grava em `performance_snapshots` — como a tabela exige um projeto, o gestor escolhe qual projeto do cliente recebe as métricas no momento de conectar (`digital_asset_connections` ganhou `project_id`)
- [x] Conexão com a Google Forms API: mesmo login, escopo a mais; o gestor cola o id ou o link do formulário ao conectar (evita precisar do escopo do Google Drive só pra listar formulários)
- [x] **Decisão confirmada com o usuário** sobre o que uma resposta de formulário gera: cria um **Alerta** (categoria "novo lead", com as respostas formatadas) pra o gestor decidir manualmente — não cria Cliente nem entidade nova. Detecção via gatilho do Google Forms (Apps Script, script pronto em `supabase/functions/integrations/forms-trigger.gs.txt`) chamando a nova rota `/forms-webhook`, com proteção por segredo compartilhado e sem duplicar Alerta se a mesma resposta chegar duas vezes (`form_response_events`)
- [x] Como `/callback` (aberta pelo navegador do Google) e o gatilho do Forms chamam a função de fora, sem sessão do Supabase, a verificação automática de JWT da função foi desligada e a autenticação passou a ser feita na mão: `/connect`/`/sync` conferem se quem chamou é admin/gestor de verdade; `/callback` se protege pelo próprio `state` (imprevisível); `/forms-webhook` por um segredo compartilhado
- [x] Testado ao vivo tudo que dava pra testar sem credenciais reais do Google: os quatro endpoints da função (`/connect`, `/sync`, `/forms-webhook` e a validação de autenticação) respondendo certo com erros esperados e claros; a URL de autorização montada corretamente (escopos, `state`, `redirect_uri`) pros dois provedores; o id do formulário sendo extraído certo de um link colado; o projeto e o formulário sendo salvos na conexão; a tela de Ativos Digitais mostrando os badges de status ("Desconectado") certinho
- [ ] **Pendente**: conexão de verdade com uma conta real do Google (você ainda não tem as credenciais do Google Cloud Console) — assim que tiver, é só cadastrar os segredos (`GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `FORMS_WEBHOOK_SECRET`, `FRONTEND_URL`) e testar o fluxo completo (login real, métricas de verdade em `performance_snapshots`, resposta de formulário virando Alerta)
- [x] **Buraco real encontrado e corrigido ao testar**: conectar Google Ads pede um projeto do cliente, mas o Portal Gestor não tinha nenhuma forma de criar projeto em lugar nenhum (só existia leitura, na tela "Meu Projeto" do Portal Cliente). Central de Informações do Cliente ganhou um card novo "Projetos" (nome, objetivo, descrição por enquanto — sem edição/exclusão nesta rodada), e o projeto criado ali já aparece corretamente no seletor do diálogo "Conectar integração" — testado ao vivo criando um projeto e confirmando que ele aparece na lista de opções
- [x] **Outro bug real encontrado e corrigido ao testar** (com o usuário clicando de verdade em "Conectar" sem credencial configurada ainda): `/connect` mandava a pessoa pro Google mesmo com o segredo `GOOGLE_OAUTH_CLIENT_ID` vazio — o Google recusava com um erro genérico ("Missing required parameter: client_id"), sem nem mostrar a tela de login, o que parecia um erro sem explicação. Agora `/connect` verifica isso antes de mandar pra qualquer lugar e devolve um aviso claro dentro do próprio app ("as credenciais do Google ainda não foram configuradas") — confirmado pelo usuário que já funciona como esperado

### Fase 6.3 — Conexão com Meta Ads
- [x] Fluxo completo de OAuth com o Meta: Meta Ads virou uma opção no mesmo diálogo "Conectar integração" (escopo `ads_read` — só leitura, sem gerenciar campanha); `/connect` monta a URL de autorização do Meta, `/callback` troca o código pelo token
- [x] Particularidade do Meta implementada: a troca de token é `GET` (não `POST` como o Google), e não existe "refresh token" separado — o token de curta duração é trocado por um de longa duração (60 dias) logo ao conectar, e renovado reexecutando essa mesma troca antes de vencer (`getValidAccessToken` agora sabe o provedor da conexão e usa a lógica certa pra cada um)
- [x] Conexão com a Meta Marketing API: `/callback` descobre a conta de anúncios acessível (`/me/adaccounts`); `/sync` passou a aceitar `meta_ads` além de `google_ads`, buscando investimento/cliques/impressões/conversões via Insights (`date_preset=last_30d&time_increment=1`) — "conversões" no Meta vem dentro de um campo `actions` (lista de ações), somado como aproximação por enquanto
- [x] Testado ao vivo tudo que dava pra testar sem credenciais reais do Meta: `/connect` pede o projeto certo, valida que `META_APP_ID` precisa estar configurado (mesmo aviso claro implementado pro Google), e o diálogo mostra "Meta Ads" como opção com o campo de projeto aparecendo certinho
- [ ] **Pendente**: conexão de verdade com uma conta real do Meta (você ainda não tem o app em developers.facebook.com) — assim que tiver, é só cadastrar `META_APP_ID`/`META_APP_SECRET` e testar. Nota do próprio documento: contas de anúncio de clientes de terceiros só funcionam de verdade depois da aprovação de Business Verification do Meta — até lá, testável só com a própria conta da agência

### Fase 6.4 — Sincronização agendada e página de Integrações
- [x] Job agendado: `migration-019-fase64-cron.sql` habilita `pg_cron`/`pg_net` e agenda uma chamada a cada 6 horas pra rota nova `/sync-all` da Edge Function `integrations` — ela busca todas as conexões `connected` de Google Ads/Meta Ads e sincroniza uma a uma (a renovação de token já acontece sozinha dentro da sincronização, reaproveitando `getValidAccessToken`); autenticada por um segredo próprio (`CRON_SECRET`), mesmo padrão do webhook do Google Forms — como o cron roda de dentro do banco, sem login de usuário por trás, precisa desse segredo em vez de JWT
- [x] Página "Integrações" (`/integrations`, novo item no menu do Portal Gestor): lista todas as conexões (de todos os Ativos Digitais), com provedor, ativo, cliente, projeto, status e última sincronização, com filtro por cliente/busca e botão "Sincronizar agora" pra Google Ads/Meta Ads — reaproveita os mesmos hooks e a mesma função de sincronização já usados no card de Ativo Digital
- [x] Confirmar que não existe mais nenhuma "Fase 8" separada — tudo consolidado nesta Fase 6 (feito no início da Fase 6, ver nota acima)
- [ ] Pendente: rodar `migration-019-fase64-cron.sql` (com o segredo já preenchido), configurar o segredo `CRON_SECRET` na Edge Function e confirmar no SQL Editor (`select * from cron.job;`) que o job `sync-integrations` ficou agendado — depende só de você rodar/configurar, não de credenciais reais

## Fase 6.5 — ajustes pedidos após a Fase 6 (uma sub-fase de cada vez)

### Fase 6.5.1 — Disponibilidade do gestor + reunião de emergência (plano Dominação)
- [x] Nova tabela `manager_availability_blocks` (`migration-020-fase65-disponibilidade-reuniao-emergencia.sql`) e aba "Disponibilidade" em Configurações (admin/gestor): grade semanal de horários (mesma lista de 30 em 30 min já usada em Reuniões) onde dá pra marcar indisponibilidade clicando na célula
- [x] Botão "Agendar reunião" do cliente virou "Reunião de emergência" (renomeado o componente pra refletir isso) — agora restrito ao plano Dominação, 1x por mês, e os horários bloqueados nas Configurações do gestor somem da lista; toda a validação (plano, limite mensal, horário bloqueado) mora numa função do banco (`request_emergency_meeting`), não só na tela, então não dá pra burlar
- [x] Isso é separado do sistema de reuniões recorrentes automáticas (Fase 5.5) — esse continua funcionando exatamente igual
- [ ] Pendente: rodar `migration-020-fase65-disponibilidade-reuniao-emergencia.sql` no SQL Editor — só depois disso a aba "Disponibilidade" carrega de verdade e o pedido de reunião de emergência funciona (testado tudo que dava pra testar sem isso: telas carregam, botão aparece desabilitado certinho pra cliente fora do plano Dominação)

### Fase 6.5.2 — Workflows para clientes + prazos por espaçamento de tempo
- [x] `apply_workflow` (já existia desde a Fase 5) passa a aceitar um `due_days` opcional em cada etapa do modelo — ao aplicar, o prazo da tarefa é calculado sozinho (hoje + os dias, no fuso da agência), sem precisar digitar prazo manual em nenhuma tarefa
- [x] Nova aba "Workflows do Cliente" dentro da página Workflows (mesma página, duas abas — "Operacional" e "Workflows do Cliente"): nova tabela `client_workflow_templates` e função `apply_client_workflow`, que aplica um modelo a um ou mais clientes escolhidos de uma vez (sem passar por projeto) — as tarefas nascem com o `client_id` certo e já aparecem na aba "Tarefas" de cada cliente
- [x] Mesma regra de acesso das duas abas: admin cria/edita/apaga modelos; admin e gestor conseguem ver e aplicar (testado com os dois papéis)
- [ ] Pendente: rodar `migration-021-fase652-workflows-cliente-prazos.sql` — só depois disso a aba "Workflows do Cliente" carrega de verdade e o cálculo de prazo passa a valer (testado tudo que dava pra testar sem isso: os dois formulários com o campo de prazo, permissões por papel, aba Operacional continuando igual)
### Fase 6.5.3 — Nova aba "Tarefas do Cliente" no Portal Gestor (pendente, detalhar quando chegar a vez)
### Fase 6.5.4 — Restringir edição dos dados da agência ao admin (pendente, detalhar quando chegar a vez)
### Fase 6.5.5 — Comentários do cliente em duas colunas (pendente, detalhar quando chegar a vez)
### Fase 6.5.6 — Mesclar Incidentes e Alertas numa aba só (pendente, detalhar quando chegar a vez)

## Fase 7 — C.A.S.S.I.E. (IA) e testes finais (provisório, detalhar quando chegar a vez)
- [ ] Funcionalidades da assistente Cassie (IA) e automações que dependerem dela
- [ ] Testes automatizados (Vitest + Playwright)
- [ ] Revisão geral de responsividade e acessibilidade
- [ ] Preparar o app para publicação (deploy)
