-- Ametista Conversões — Fase 3: entidades e banco de dados
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". É seguro
-- rodar isso uma única vez, com a Fase 2 já configurada.

-- =========================================================
-- 1. Listas fechadas (enums) — só aceitam os valores listados
-- =========================================================
create type public.client_status as enum ('active', 'onboarding', 'paused', 'churned');
create type public.project_status as enum ('planning', 'active', 'paused', 'completed', 'cancelled');
create type public.task_status as enum ('backlog', 'todo', 'in_progress', 'review', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.review_status as enum ('pending', 'approved', 'rejected', 'revision_requested');
create type public.smart_goal_status as enum ('on_track', 'at_risk', 'off_track', 'completed');
create type public.severity_level as enum ('low', 'medium', 'high', 'critical');
create type public.incident_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.meeting_status as enum ('scheduled', 'completed', 'cancelled');
create type public.digital_asset_status as enum ('active', 'inactive', 'pending', 'revoked');
create type public.feature_flag_scope as enum ('global', 'agency', 'client', 'user');

-- =========================================================
-- 2. Função que atualiza "updated_at" sozinha a cada edição de linha
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- 3. Clients — a entidade "Client" do CLAUDE.md
-- =========================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  status public.client_status not null default 'onboarding',
  plan text,
  monthly_fee numeric,
  health_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.clients
  for each row execute procedure public.set_updated_at();

-- Liga cada usuário "cliente" à empresa-cliente dele. Contas admin/gestor
-- deixam esta coluna vazia (null).
alter table public.profiles add column client_id uuid references public.clients (id);

-- =========================================================
-- 4. Funções auxiliares de segurança (usadas pelas políticas abaixo)
-- =========================================================
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_client_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select client_id from public.profiles where id = auth.uid();
$$;

-- =========================================================
-- 5. Organizations — configuração da agência/plataforma (sem client_id)
-- =========================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text,
  status text,
  domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.organizations
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 6. Feature flags — configuração (sem client_id)
-- =========================================================
create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text,
  enabled boolean not null default false,
  scope public.feature_flag_scope not null default 'global',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.feature_flags
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 7. Projects
-- =========================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  status public.project_status not null default 'planning',
  health_score integer,
  cpa numeric,
  roas numeric,
  ctr numeric,
  spend numeric,
  revenue numeric,
  channel text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 8. Tasks
-- =========================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  status public.task_status not null default 'backlog',
  priority public.task_priority not null default 'medium',
  due_date date,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 9. Onboarding steps
-- =========================================================
create table public.onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  completed boolean not null default false,
  step_order integer not null default 0,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.onboarding_steps
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 10. Smart goals
-- =========================================================
create table public.smart_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  metric_type text,
  target_value numeric,
  current_value numeric,
  period text,
  status public.smart_goal_status not null default 'on_track',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.smart_goals
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 11. File items
-- =========================================================
create table public.file_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  folder text,
  file_url text,
  file_type text,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.file_items
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 12. Approvals
-- =========================================================
create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  file_url text,
  file_type text,
  status public.review_status not null default 'pending',
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.approvals
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 13. Incidents
-- =========================================================
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  severity public.severity_level not null default 'medium',
  status public.incident_status not null default 'open',
  category text,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.incidents
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 14. Alerts
-- =========================================================
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  client_id uuid not null references public.clients (id) on delete cascade,
  severity public.severity_level not null default 'medium',
  category text,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.alerts
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 15. Digital assets
-- =========================================================
create table public.digital_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  client_id uuid not null references public.clients (id) on delete cascade,
  platform text,
  status public.digital_asset_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.digital_assets
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 16. Meetings
-- =========================================================
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  date timestamptz,
  meeting_link text,
  status public.meeting_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.meetings
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 17. Comments — referência genérica a qualquer outra entidade
-- =========================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  entity_type text not null,
  entity_id uuid not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  author_role public.user_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.comments
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 18. Audit logs
-- =========================================================
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text,
  entity_id uuid,
  client_id uuid references public.clients (id) on delete set null,
  severity public.severity_level not null default 'low',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.audit_logs
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- 19. Índices — deixam as consultas filtradas por cliente mais rápidas
-- =========================================================
create index on public.projects (client_id);
create index on public.tasks (client_id);
create index on public.tasks (project_id);
create index on public.onboarding_steps (client_id);
create index on public.onboarding_steps (project_id);
create index on public.smart_goals (client_id);
create index on public.file_items (client_id);
create index on public.approvals (client_id);
create index on public.incidents (client_id);
create index on public.alerts (client_id);
create index on public.digital_assets (client_id);
create index on public.meetings (client_id);
create index on public.comments (client_id);
create index on public.comments (entity_type, entity_id);
create index on public.audit_logs (client_id);
create index on public.profiles (client_id);

-- =========================================================
-- 20. Segurança (RLS) — mesma regra em (quase) todas as tabelas:
--     admin/gestor veem e editam tudo; cliente só LÊ as linhas do
--     próprio client_id. organizations e feature_flags são só de
--     admin/gestor (não são visíveis para clientes).
-- =========================================================

-- clients (é o próprio cliente, não tem coluna client_id)
alter table public.clients enable row level security;
create policy "admin_gestor_full_clients" on public.clients for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprio_registro" on public.clients for select
  using (public.current_user_role() = 'cliente' and id = public.current_user_client_id());

-- organizations
alter table public.organizations enable row level security;
create policy "admin_gestor_full_organizations" on public.organizations for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));

-- feature_flags
alter table public.feature_flags enable row level security;
create policy "admin_gestor_full_feature_flags" on public.feature_flags for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));

-- projects
alter table public.projects enable row level security;
create policy "admin_gestor_full_projects" on public.projects for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprios_projects" on public.projects for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- tasks
alter table public.tasks enable row level security;
create policy "admin_gestor_full_tasks" on public.tasks for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprias_tasks" on public.tasks for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- onboarding_steps
alter table public.onboarding_steps enable row level security;
create policy "admin_gestor_full_onboarding_steps" on public.onboarding_steps for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprios_onboarding_steps" on public.onboarding_steps for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- smart_goals
alter table public.smart_goals enable row level security;
create policy "admin_gestor_full_smart_goals" on public.smart_goals for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprias_smart_goals" on public.smart_goals for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- file_items
alter table public.file_items enable row level security;
create policy "admin_gestor_full_file_items" on public.file_items for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprios_file_items" on public.file_items for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- approvals
alter table public.approvals enable row level security;
create policy "admin_gestor_full_approvals" on public.approvals for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprios_approvals" on public.approvals for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- incidents
alter table public.incidents enable row level security;
create policy "admin_gestor_full_incidents" on public.incidents for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprios_incidents" on public.incidents for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- alerts
alter table public.alerts enable row level security;
create policy "admin_gestor_full_alerts" on public.alerts for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprios_alerts" on public.alerts for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- digital_assets
alter table public.digital_assets enable row level security;
create policy "admin_gestor_full_digital_assets" on public.digital_assets for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprios_digital_assets" on public.digital_assets for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- meetings
alter table public.meetings enable row level security;
create policy "admin_gestor_full_meetings" on public.meetings for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprias_meetings" on public.meetings for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- comments
alter table public.comments enable row level security;
create policy "admin_gestor_full_comments" on public.comments for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprios_comments" on public.comments for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- audit_logs
alter table public.audit_logs enable row level security;
create policy "admin_gestor_full_audit_logs" on public.audit_logs for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprios_audit_logs" on public.audit_logs for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());
