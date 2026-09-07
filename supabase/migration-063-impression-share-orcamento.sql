-- Ametista Conversões — Parcela de impressões perdida (classificação e
-- orçamento) + orçamento da campanha, sincronizados junto com o resto
-- em campaign_performance_snapshots. Só existem de verdade em
-- campanhas de Pesquisa do Google Ads (Display/Vídeo/Performance Max
-- ficam null, tratado como "—" na UI, igual toda métrica opcional do
-- app) — Meta Ads também fica sempre null aqui, não expõe esse
-- conceito na Graph API.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

alter table public.campaign_performance_snapshots
  add column if not exists search_rank_lost_impression_share numeric,
  add column if not exists search_budget_lost_impression_share numeric,
  add column if not exists budget_amount numeric;
