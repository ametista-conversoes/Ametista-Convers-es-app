-- Ametista Conversões — tipo de campanha (Search/PMax/Shopping/Vídeo/...)
-- e valor de conversão reportado pela própria plataforma, sincronizados
-- junto com o resto (mesma consulta de sempre, só campos a mais).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Seguro
-- rodar de novo mesmo se você já rodou uma versão anterior.

alter table public.campaign_performance_snapshots
  add column if not exists campaign_type text,
  add column if not exists conversion_value numeric;
