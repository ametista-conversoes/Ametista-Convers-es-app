-- Ametista Conversões — Fase 4.1: Dashboard e Performance (Portal do Cliente)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Rode DEPOIS
-- do migration-002-phase3-entities.sql.

-- =========================================================
-- 1. Sub-notas do Health Score — preenchidas manualmente pelo gestor
--    (a tela de edição vem na Fase 5). Mesma faixa 0-100 do health_score.
-- =========================================================
alter table public.clients
  add column health_performance integer check (health_performance between 0 and 100),
  add column health_financial integer check (health_financial between 0 and 100),
  add column health_delivery integer check (health_delivery between 0 and 100),
  add column health_relationship integer check (health_relationship between 0 and 100);

-- =========================================================
-- 2. Retratos diários de performance por projeto — alimentam o gráfico
--    de tendência. No futuro, viriam de uma integração real com as
--    plataformas de anúncio; por enquanto, população manual/seed.
-- =========================================================
create table public.performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  snapshot_date date not null,
  spend numeric,
  revenue numeric,
  roas numeric,
  ctr numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, snapshot_date)
);

create trigger set_updated_at before update on public.performance_snapshots
  for each row execute procedure public.set_updated_at();

create index on public.performance_snapshots (client_id);
create index on public.performance_snapshots (project_id, snapshot_date);

alter table public.performance_snapshots enable row level security;

create policy "admin_gestor_full_performance_snapshots" on public.performance_snapshots for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
create policy "cliente_le_proprios_performance_snapshots" on public.performance_snapshots for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());
