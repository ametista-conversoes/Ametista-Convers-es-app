-- Ametista Conversões — Fase 14: workflow operacional padrão por cliente.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Só uma coluna nova — é uma pré-seleção de conveniência na hora de
-- aplicar um workflow (não aplica nada sozinho). Sem RLS nova: já
-- coberta pelas políticas existentes de "clients" (leitura admin/
-- gestor, escrita admin/gestor).

alter table public.clients
  add column default_workflow_template_id uuid references public.workflow_templates (id) on delete set null;
