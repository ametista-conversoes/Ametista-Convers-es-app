-- Ametista Conversões — Fase 21.1: Monitoramento de erros (tipo
-- Sentry, mas próprio, dentro do Supabase) — tabela que recebe tanto
-- erro de front-end (ErrorBoundary + window.onerror/unhandledrejection,
-- ver src/lib/error-logging.ts) quanto erro de Edge Function (via
-- logServerError, que estende os helpers dbErrorResponse/
-- platformErrorResponse já existentes desde a Fase 20.1), pra ter um
-- lugar só (/errors, Portal Gestor) de ver e resolver.

create table public.error_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('frontend', 'edge_function')),
  function_name text,
  message text not null,
  stack text,
  context jsonb,
  severity public.severity_level not null default 'medium',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.error_logs (created_at desc);
create index on public.error_logs (resolved);

alter table public.error_logs enable row level security;

-- Insert liberado geral (inclusive anon) — um erro pode acontecer
-- antes do login, e o objetivo aqui é nunca perder um registro por
-- causa de RLS. Leitura/edição só admin/gestor — ferramenta interna
-- de operação, cliente não vê.
create policy "anyone_insert_error_logs" on public.error_logs for insert
  with check (true);

create policy "admin_gestor_read_error_logs" on public.error_logs for select
  using (public.current_user_role() in ('admin', 'gestor'));

create policy "admin_gestor_update_error_logs" on public.error_logs for update
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));

create policy "admin_gestor_delete_error_logs" on public.error_logs for delete
  using (public.current_user_role() in ('admin', 'gestor'));
