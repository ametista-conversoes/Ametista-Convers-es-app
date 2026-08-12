-- Ametista Conversões — Fase 6.5.6: mesclar Incidentes e Alertas numa
-- aba só (só na tela — as duas tabelas continuam existindo como
-- estão, sem mexer no webhook do Google Forms que já cria alertas
-- sozinho).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

alter table public.incidents add column if not exists description text;
