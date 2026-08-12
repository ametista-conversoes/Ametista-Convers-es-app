-- Fase 6.6.1 — Integrações passam a ser por cliente, não por projeto.
-- Antes, toda conexão (Google Ads/Meta Ads) exigia escolher um projeto do
-- cliente pra receber as métricas — como uma conexão só aponta pra um
-- projeto por vez, um cliente com 2+ projetos na mesma conta de anúncios
-- forçava o gestor a criar outro Ativo Digital e refazer o OAuth do zero.
-- performance_snapshots.project_id vira opcional, e a chave de upsert passa
-- a ser por cliente + canal + dia (não muda nenhuma tela do portal do
-- cliente, que já lê performance_snapshots só por client_id).

alter table public.performance_snapshots alter column project_id drop not null;

alter table public.performance_snapshots
  drop constraint if exists performance_snapshots_project_id_snapshot_date_key;

alter table public.performance_snapshots
  add constraint performance_snapshots_client_channel_date_key unique (client_id, channel, snapshot_date);
