-- Ametista Conversões — Fase 6.2: conexão real com Google (Ads e Forms).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Seguro
-- rodar de novo mesmo se você já rodou uma versão anterior.

-- =========================================================
-- 1. Toda conexão de Google Ads precisa saber pra qual projeto do
--    cliente as métricas sincronizadas devem ir (performance_snapshots
--    exige project_id) — escolhido pelo gestor no momento de conectar.
--    Não é obrigatório pra conexões de Google Forms.
-- =========================================================
alter table public.digital_asset_connections add column if not exists project_id uuid references public.projects (id);

-- =========================================================
-- 2. Evita criar um Alerta duplicado se o gatilho do Google Forms
--    reenviar a mesma resposta (ex: falha de rede e o Apps Script tenta
--    de novo). Sem política pra "authenticated" — só a Edge Function
--    (service role) grava aqui.
-- =========================================================
create table if not exists public.form_response_events (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.digital_asset_connections (id) on delete cascade,
  response_id text not null,
  created_at timestamptz not null default now(),
  unique (connection_id, response_id)
);

alter table public.form_response_events enable row level security;
-- (De propósito: nenhuma política criada aqui.)
