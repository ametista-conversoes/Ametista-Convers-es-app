-- Ametista Conversões — Fase 11c (parte 3/3): gatilhos de evento
-- (incidente/alerta criado) + agendamento do cron que dispara os
-- lembretes por tempo (reunião, meta atrasada, cliente em risco).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query). ANTES de rodar, troque o
-- placeholder '<COLE_AQUI_O_VALOR_DO_NOTIFICATIONS_CRON_SECRET>' pelo
-- MESMO valor configurado no segredo NOTIFICATIONS_CRON_SECRET da Edge
-- Function "notifications" (Fase 11c.2) — o valor de verdade não fica
-- neste arquivo (mesmo padrão já usado em migration-019-fase64-cron.sql
-- pro CRON_SECRET), porque este repositório é público no GitHub.
-- Depois clique em "Run". Rode DEPOIS de migration-037 e de criar a
-- Edge Function "notifications" (Fase 11c.2).

-- =========================================================
-- 1. Gatilhos de evento — incidente/alerta criado. Mesmo padrão dos
--    gatilhos de auditoria (migration-009/migration-036), só que em
--    vez de "insert into audit_logs" chama a Edge Function via
--    net.http_post (dentro de função plpgsql usa-se "perform", não
--    "select", diferente do corpo do cron.schedule mais abaixo).
-- =========================================================
create or replace function public.notify_incident_created()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://ktexhzcpqrqjdgzgxisx.supabase.co/functions/v1/notifications/dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Notifications-Secret', '<COLE_AQUI_O_VALOR_DO_NOTIFICATIONS_CRON_SECRET>'
    ),
    body := jsonb_build_object('kind', 'incident_created', 'entity_id', NEW.id)
  );
  return NEW;
end;
$$;

drop trigger if exists trg_incidents_notify on public.incidents;
create trigger trg_incidents_notify
  after insert on public.incidents
  for each row execute procedure public.notify_incident_created();

create or replace function public.notify_alert_created()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://ktexhzcpqrqjdgzgxisx.supabase.co/functions/v1/notifications/dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Notifications-Secret', '<COLE_AQUI_O_VALOR_DO_NOTIFICATIONS_CRON_SECRET>'
    ),
    body := jsonb_build_object('kind', 'alert_created', 'entity_id', NEW.id)
  );
  return NEW;
end;
$$;

drop trigger if exists trg_alerts_notify on public.alerts;
create trigger trg_alerts_notify
  after insert on public.alerts
  for each row execute procedure public.notify_alert_created();

-- =========================================================
-- 2. Cron — chama /tick a cada 1 minuto, que roda as checagens por
--    tempo (cliente em risco, meta atrasada, lembrete de reunião
--    1h/15min) e despacha só o que for novo (dedup já feito lá dentro).
--    pg_cron/pg_net já estão habilitados desde migration-019.
-- =========================================================
select cron.schedule(
  'notifications-tick',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://ktexhzcpqrqjdgzgxisx.supabase.co/functions/v1/notifications/tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Notifications-Secret', '<COLE_AQUI_O_VALOR_DO_NOTIFICATIONS_CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Pra conferir que o job ficou agendado certinho:
--   select * from cron.job where jobname = 'notifications-tick';
-- Pra cancelar o agendamento, se precisar:
--   select cron.unschedule('notifications-tick');
