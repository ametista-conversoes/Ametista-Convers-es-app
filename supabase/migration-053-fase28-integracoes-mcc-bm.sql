-- Ametista Conversões — Fase 28: integrações via conta administradora
-- (MCC no Google Ads, Business Manager no Meta) em vez de OAuth por
-- cliente. Separa "autenticação da agência" (1x, aqui) de "seleção da
-- conta do cliente" (Edge Function "integrations", rota nova
-- /link-agency-account) — o vínculo cliente↔MCC/BM em si é feito
-- manualmente dentro do próprio Google Ads/Meta, o app não automatiza
-- isso.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase, depois clique em "Run".

-- =========================================================
-- 1. Conexão de agência — 1 linha por provedor (google_ads/meta_ads),
--    não por cliente. Só leitura pra admin/gestor; quem escreve é
--    sempre a Edge Function (service role) — "só admin conecta" é
--    garantido lá dentro, checando o papel de quem chama.
-- =========================================================
create table if not exists public.agency_provider_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique check (provider in ('google_ads', 'meta_ads')),
  status text not null default 'disconnected' check (status in ('disconnected', 'connected', 'error')),
  -- Só usado pro Meta (id do Business Manager). Google Ads não precisa:
  -- os MCCs acessíveis já são descobertos ao vivo (discoverGoogleAdsClientAccounts).
  external_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.agency_provider_connections;
create trigger set_updated_at before update on public.agency_provider_connections
  for each row execute procedure public.set_updated_at();

alter table public.agency_provider_connections enable row level security;

drop policy if exists "admin_gestor_le_agency_provider_connections" on public.agency_provider_connections;
create policy "admin_gestor_le_agency_provider_connections" on public.agency_provider_connections for select
  using (public.current_user_role() in ('admin', 'gestor'));

-- =========================================================
-- 2. Token OAuth da conexão de agência — mesmo formato de
--    "oauth_tokens" (Fase 6.1), tabela separada em vez de reaproveitar
--    a mesma (que tem FK 1:1 com digital_asset_connections) pra não
--    mexer em nada que já funciona nas conexões antigas. Reaproveita
--    as MESMAS funções de Vault (store_oauth_secret/read_oauth_secret,
--    já genéricas). Sem NENHUMA política — só a Edge Function
--    (service role) lê/escreve aqui.
-- =========================================================
create table if not exists public.agency_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  agency_connection_id uuid not null unique references public.agency_provider_connections (id) on delete cascade,
  access_token_secret_id uuid not null,
  refresh_token_secret_id uuid,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.agency_oauth_tokens;
create trigger set_updated_at before update on public.agency_oauth_tokens
  for each row execute procedure public.set_updated_at();

alter table public.agency_oauth_tokens enable row level security;
-- (De propósito: nenhuma política criada aqui.)

-- =========================================================
-- 3. digital_asset_connections ganha o vínculo opcional com a conexão
--    de agência. Nula em toda linha existente — conexão antiga (OAuth
--    próprio, com sua própria linha em oauth_tokens) continua
--    funcionando exatamente como está; só conexão nova (escolhida a
--    partir da lista da conta administradora) preenche isso.
-- =========================================================
alter table public.digital_asset_connections
  add column if not exists agency_provider_connection_id uuid references public.agency_provider_connections (id);
