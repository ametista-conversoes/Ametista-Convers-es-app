-- Ametista Conversões — Fase 6.4: sincronização agendada das
-- integrações (Google Ads / Meta Ads).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query). ANTES de rodar, troque o
-- placeholder '<COLE_AQUI_O_VALOR_DO_SEGREDO_CRON_SECRET>' abaixo pelo
-- mesmo valor que você configurar no segredo CRON_SECRET da Edge
-- Function "integrations" (Edge Functions > integrations > Secrets).
-- Depois clique em "Run".
--
-- pg_cron/pg_net são extensões nativas do Postgres hospedado pelo
-- Supabase — habilitar aqui é o mesmo fluxo zero-instalação de sempre,
-- sem precisar de nenhuma ferramenta local.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Roda a cada 6 horas, chamando a rota /sync-all da Edge Function, que
-- sincroniza sozinha todas as conexões "connected" de Google Ads/Meta
-- Ads (renovando token quando preciso) e grava as métricas novas em
-- performance_snapshots. `cron.schedule` com o mesmo nome de job
-- atualiza o job existente em vez de duplicar, então este arquivo
-- continua seguro de rodar de novo (ex: se trocar o segredo).
select cron.schedule(
  'sync-integrations',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://ktexhzcpqrqjdgzgxisx.supabase.co/functions/v1/integrations/sync-all',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', '<COLE_AQUI_O_VALOR_DO_SEGREDO_CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Pra conferir que o job ficou agendado certinho:
--   select * from cron.job;
-- Pra cancelar o agendamento, se precisar:
--   select cron.unschedule('sync-integrations');
