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
- [ ] Configurar projeto no Supabase (autenticação + banco) e explicar como criar a conta e pegar as chaves de API
- [ ] Criar páginas de Login, Registro e Esqueci a senha
- [ ] Criar o `ProtectedRoute` (bloqueia quem não está logado)
- [ ] Criar o `RoleRoute` (bloqueia usuários `cliente` de acessarem rotas do Portal do Gestor)
- [ ] Ligar a Sidebar para mostrar apenas as seções do papel do usuário logado

## Fase 3 — Entidades e banco de dados
- [ ] Criar as 16 entidades listadas no `CLAUDE.md`, com campos e relacionamentos corretos
- [ ] Configurar Row Level Security (cliente só vê os próprios dados)
- [ ] Popular dados de teste (seed) para visualização

## Fase 4 — Portal do Cliente (provisório, detalhar quando chegar a vez)
- [ ] Construir as páginas reais do Portal do Cliente (dashboard, performance, projeto, tarefas, arquivos, comentários, reuniões, IA, relatórios, configurações) ligadas ao banco de dados

## Fase 5 — Portal do Gestor (provisório, detalhar quando chegar a vez)
- [ ] Construir as páginas reais do Portal do Gestor (dashboard executivo, clientes, kanban, workflows, incidentes, ativos digitais, alertas, timeline, metas SMART, onboarding) ligadas ao banco de dados

## Fase 6 — Recursos avançados / IA (provisório, detalhar quando chegar a vez)
- [ ] Funcionalidades da assistente Cassie (IA) e automações que dependerem dela

## Fase 7 — Acabamento, testes e publicação (provisório, detalhar quando chegar a vez)
- [ ] Testes automatizados (Vitest + Playwright)
- [ ] Revisão geral de responsividade e acessibilidade
- [ ] Preparar o app para publicação (deploy)
