-- Fase 8.2 — Sincronização estruturada do Google Forms. Até aqui, uma
-- resposta de formulário só virava um Alerta genérico com o texto das
-- respostas colado (ver /forms-webhook em supabase/functions/integrations
-- — isso continua existindo, sem mudança). Estas tabelas novas guardam a
-- estrutura de verdade (pergunta por pergunta, resposta por resposta),
-- sincronizada direto da API do Google Forms usando o token OAuth que a
-- conexão já guarda desde a Fase 6.2 (só nunca tinha sido usado pra
-- nada). Mesmo padrão de RLS de campaign_performance_snapshots
-- (migration-032): só leitura pra admin/gestor, quem escreve é sempre a
-- Edge Function (service role).

create table if not exists public.form_questions (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.digital_asset_connections (id) on delete cascade,
  external_question_id text not null,
  title text not null,
  question_type text not null,
  options jsonb,
  position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, external_question_id)
);

drop trigger if exists set_updated_at on public.form_questions;
create trigger set_updated_at before update on public.form_questions
  for each row execute procedure public.set_updated_at();

create index if not exists form_questions_connection_id_idx
  on public.form_questions (connection_id);

alter table public.form_questions enable row level security;

drop policy if exists "admin_gestor_le_form_questions" on public.form_questions;
create policy "admin_gestor_le_form_questions" on public.form_questions for select
  using (public.current_user_role() in ('admin', 'gestor'));

create table if not exists public.form_responses (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.digital_asset_connections (id) on delete cascade,
  external_response_id text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (connection_id, external_response_id)
);

create index if not exists form_responses_connection_id_idx
  on public.form_responses (connection_id);
create index if not exists form_responses_client_id_idx
  on public.form_responses (client_id);

alter table public.form_responses enable row level security;

drop policy if exists "admin_gestor_le_form_responses" on public.form_responses;
create policy "admin_gestor_le_form_responses" on public.form_responses for select
  using (public.current_user_role() in ('admin', 'gestor'));

create table if not exists public.form_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.form_responses (id) on delete cascade,
  external_question_id text not null,
  answer_text text,
  answer_values jsonb,
  created_at timestamptz not null default now(),
  unique (response_id, external_question_id)
);

create index if not exists form_answers_response_id_idx
  on public.form_answers (response_id);

alter table public.form_answers enable row level security;

drop policy if exists "admin_gestor_le_form_answers" on public.form_answers;
create policy "admin_gestor_le_form_answers" on public.form_answers for select
  using (public.current_user_role() in ('admin', 'gestor'));
