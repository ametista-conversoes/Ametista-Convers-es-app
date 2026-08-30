-- Ametista Conversões — Fase 21.4: lembrete de renovação de contrato
-- (30 dias, 7 dias e 1 dia antes de `clients.renewal_date`) — mesmo
-- molde dos lembretes de reunião (migration-037), notificação push
-- só pra admin/gestor (aviso interno da agência, não do cliente).

-- Estende o check de `kind` já existente em push_notification_log
-- (migration-037) pros 3 novos tipos.
alter table public.push_notification_log drop constraint if exists push_notification_log_kind_check;
alter table public.push_notification_log add constraint push_notification_log_kind_check check (kind in (
  'incident_created', 'alert_created', 'client_at_risk',
  'meeting_reminder_1h', 'meeting_reminder_15m', 'smart_goal_overdue',
  'renewal_reminder_30d', 'renewal_reminder_7d', 'renewal_reminder_1d'
));

create index on public.clients (renewal_date) where renewal_date is not null;

-- Dispara quando faltam exatamente 30/7/1 dias — `renewal_date` é uma
-- coluna `date` (sem hora), então cada condição fica verdadeira o dia
-- inteiro; como o tick roda a cada minuto e o dedup é por
-- unique(kind, entity_id), basta o cron rodar 1 vez nesse dia pra
-- disparar (tolerante a atraso dentro do próprio dia).
create or replace function public.detect_new_renewal_reminders_30d()
returns table(id uuid)
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  return query
  insert into public.push_notification_log (kind, entity_id)
  select 'renewal_reminder_30d', c.id from public.clients c
  where c.renewal_date is not null and c.renewal_date - current_date = 30
  on conflict (kind, entity_id) do nothing
  returning push_notification_log.entity_id;
end;
$$;

grant execute on function public.detect_new_renewal_reminders_30d() to authenticated;

create or replace function public.detect_new_renewal_reminders_7d()
returns table(id uuid)
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  return query
  insert into public.push_notification_log (kind, entity_id)
  select 'renewal_reminder_7d', c.id from public.clients c
  where c.renewal_date is not null and c.renewal_date - current_date = 7
  on conflict (kind, entity_id) do nothing
  returning push_notification_log.entity_id;
end;
$$;

grant execute on function public.detect_new_renewal_reminders_7d() to authenticated;

create or replace function public.detect_new_renewal_reminders_1d()
returns table(id uuid)
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  return query
  insert into public.push_notification_log (kind, entity_id)
  select 'renewal_reminder_1d', c.id from public.clients c
  where c.renewal_date is not null and c.renewal_date - current_date = 1
  on conflict (kind, entity_id) do nothing
  returning push_notification_log.entity_id;
end;
$$;

grant execute on function public.detect_new_renewal_reminders_1d() to authenticated;

-- Se a data de renovação mudar (contrato renovado, ou correção
-- manual), libera os 3 lembretes de novo — sem isso, uma vez marcado
-- como "já avisado" ficaria bloqueado pra sempre, mesmo numa data nova.
create or replace function public.clear_renewal_reminder_log()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if NEW.renewal_date is distinct from OLD.renewal_date then
    delete from public.push_notification_log
    where entity_id = NEW.id and kind in ('renewal_reminder_30d', 'renewal_reminder_7d', 'renewal_reminder_1d');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_clients_clear_renewal_reminder_log on public.clients;
create trigger trg_clients_clear_renewal_reminder_log
  after update on public.clients
  for each row execute procedure public.clear_renewal_reminder_log();
