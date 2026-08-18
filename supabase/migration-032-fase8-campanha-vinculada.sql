-- Fase 8.1b — Vínculo de projeto com uma campanha real do Meta
-- Ads/Google Ads. A conexão (OAuth) continua por cliente, como já era
-- desde a migration-024 — só a escolha de QUAL campanha daquela conta
-- passa a ser por projeto.

alter table public.projects
  add column if not exists external_connection_id uuid references public.digital_asset_connections (id) on delete set null,
  add column if not exists external_campaign_id text,
  add column if not exists external_campaign_name text;

create table if not exists public.campaign_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.digital_asset_connections (id) on delete cascade,
  external_campaign_id text not null,
  external_campaign_name text,
  client_id uuid not null references public.clients (id) on delete cascade,
  channel text not null,
  snapshot_date date not null,
  spend numeric,
  clicks integer,
  impressions integer,
  conversions integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, external_campaign_id, snapshot_date)
);

drop trigger if exists set_updated_at on public.campaign_performance_snapshots;
create trigger set_updated_at before update on public.campaign_performance_snapshots
  for each row execute procedure public.set_updated_at();

create index if not exists campaign_performance_snapshots_client_id_idx
  on public.campaign_performance_snapshots (client_id);
create index if not exists campaign_performance_snapshots_campaign_idx
  on public.campaign_performance_snapshots (connection_id, external_campaign_id);

alter table public.campaign_performance_snapshots enable row level security;

drop policy if exists "admin_gestor_le_campaign_performance_snapshots" on public.campaign_performance_snapshots;
create policy "admin_gestor_le_campaign_performance_snapshots" on public.campaign_performance_snapshots for select
  using (public.current_user_role() in ('admin', 'gestor'));
