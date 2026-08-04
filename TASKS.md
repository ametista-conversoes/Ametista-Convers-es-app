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

### Fase 4.4 — Configurações
- [ ] Configurações (`/settings`): abas Globais/Agência/Cliente/Usuário filtradas por papel

## Fase 5 — Portal do Gestor (provisório, detalhar quando chegar a vez)
- [ ] Construir as páginas reais do Portal do Gestor (dashboard executivo, clientes, kanban, workflows, incidentes, ativos digitais, alertas, timeline, metas SMART, onboarding) ligadas ao banco de dados

## Fase 6 — Recursos avançados / IA (provisório, detalhar quando chegar a vez)
- [ ] Funcionalidades da assistente Cassie (IA) e automações que dependerem dela

## Fase 7 — Acabamento, testes e publicação (provisório, detalhar quando chegar a vez)
- [ ] Testes automatizados (Vitest + Playwright)
- [ ] Revisão geral de responsividade e acessibilidade
- [ ] Preparar o app para publicação (deploy)

## Fase 8 — Integrações externas de dados (provisório, detalhar quando chegar a vez)
- [ ] Conectar dados reais de plataformas externas (Google Ads, Meta Ads, Google Forms, etc.) via Supabase Edge Functions, alimentando as mesmas tabelas que o app já lê hoje (sem precisar recriar as telas)
