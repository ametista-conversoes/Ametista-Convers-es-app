-- Ametista Conversões — Fase 6.1: fundação do backend de integrações
-- (Google Ads, Meta Ads, Google Forms). Só a estrutura genérica —
-- nenhum provedor real ainda (isso é a Fase 6.2/6.3).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Seguro
-- rodar de novo mesmo se você já rodou uma versão anterior — todo
-- passo abaixo é escrito pra não dar erro em cima do que já existe.

-- =========================================================
-- 1. performance_snapshots ganha as colunas que faltam pra guardar
--    métricas vindas de integrações (em vez de criar uma tabela nova
--    "MetricSnapshot" duplicada — as telas de Performance/Relatórios
--    já leem daqui).
-- =========================================================
alter table public.performance_snapshots add column if not exists channel text;
alter table public.performance_snapshots add column if not exists clicks integer;
alter table public.performance_snapshots add column if not exists impressions integer;
alter table public.performance_snapshots add column if not exists conversions integer;

-- =========================================================
-- 2. Conexões de integração — uma linha por Ativo Digital conectado a
--    um provedor. Só leitura pra admin/gestor (mostrar status na
--    página de Integrações, Fase 6.4); quem escreve é sempre a Edge
--    Function (service role, ignora RLS).
-- =========================================================
create table if not exists public.digital_asset_connections (
  id uuid primary key default gen_random_uuid(),
  digital_asset_id uuid not null references public.digital_assets (id) on delete cascade,
  provider text not null check (provider in ('google_ads', 'google_forms', 'meta_ads')),
  status text not null default 'disconnected' check (status in ('disconnected', 'connected', 'error')),
  external_account_id text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (digital_asset_id, provider)
);

drop trigger if exists set_updated_at on public.digital_asset_connections;
create trigger set_updated_at before update on public.digital_asset_connections
  for each row execute procedure public.set_updated_at();

alter table public.digital_asset_connections enable row level security;

drop policy if exists "admin_gestor_le_digital_asset_connections" on public.digital_asset_connections;
create policy "admin_gestor_le_digital_asset_connections" on public.digital_asset_connections for select
  using (public.current_user_role() in ('admin', 'gestor'));

-- =========================================================
-- 3. Criptografia dos tokens via Supabase Vault (não pgsodium na mão —
--    isso foi tentado primeiro e esbarrou em "permission denied for
--    function crypto_aead_det_encrypt": as funções de baixo nível do
--    pgsodium são travadas por padrão, e o Vault existe exatamente pra
--    guardar segredos como este sem esbarrar nisso). O valor do token
--    nunca é salvo em texto puro — só o id do segredo no Vault fica em
--    "oauth_tokens".
-- =========================================================
create extension if not exists pgsodium;
create extension if not exists supabase_vault;

create or replace function public.store_oauth_secret(secret text)
returns uuid
language sql
security definer
set search_path = vault, public
as $$
  select vault.create_secret(secret);
$$;

create or replace function public.read_oauth_secret(secret_id uuid)
returns text
language sql
security definer
set search_path = vault, public
as $$
  select decrypted_secret from vault.decrypted_secrets where id = secret_id;
$$;

revoke execute on function public.store_oauth_secret(text) from public, authenticated;
revoke execute on function public.read_oauth_secret(uuid) from public, authenticated;
grant execute on function public.store_oauth_secret(text) to service_role;
grant execute on function public.read_oauth_secret(uuid) to service_role;

-- =========================================================
-- 4. Tokens OAuth — guarda só o id do segredo no Vault (não o valor).
--    Tabela sem NENHUMA política pra "authenticated": com RLS ligado e
--    zero políticas, ninguém lê/escreve aqui pelo app, só a Edge
--    Function (service role).
-- =========================================================
drop table if exists public.oauth_tokens cascade;

create table public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.digital_asset_connections (id) on delete cascade,
  access_token_secret_id uuid not null,
  refresh_token_secret_id uuid,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.oauth_tokens
  for each row execute procedure public.set_updated_at();

alter table public.oauth_tokens enable row level security;
-- (De propósito: nenhuma política criada aqui.)
