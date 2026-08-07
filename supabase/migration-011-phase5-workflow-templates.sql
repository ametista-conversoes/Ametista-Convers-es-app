-- Ametista Conversões — Workflows configuráveis (Portal do Gestor)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Rode DEPOIS
-- do migration-010-phase5-emergency-pause.sql, e ANTES do
-- seed-011-workflow-templates.sql.

-- =========================================================
-- Os 4 modelos de workflow deixam de ser fixos no código e passam a
-- morar aqui — assim dá pra criar novos pelo app. "steps" guarda a
-- lista de etapas no mesmo formato que a função apply_workflow já
-- espera: [{ "title": "...", "category": "..." }, ...].
-- =========================================================
create table public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.workflow_templates
  for each row execute procedure public.set_updated_at();

alter table public.workflow_templates enable row level security;

-- Só admin cria/edita/apaga modelos.
create policy "admin_full_workflow_templates" on public.workflow_templates for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- admin e gestor conseguem ler (pra aplicar o workflow), mas só isso.
create policy "gestor_le_workflow_templates" on public.workflow_templates for select
  using (public.current_user_role() in ('admin', 'gestor'));
