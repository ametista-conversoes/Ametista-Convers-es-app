-- Ametista Conversões — Fase 11c (parte 1/3): Sistema de notificações
-- push — tabelas, RLS e funções de detecção.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Contexto: notificações push de verdade (chegam mesmo com o site
-- fechado, estilo WhatsApp Desktop). Esta parte só cria a base de
-- dados — nenhuma notificação é enviada ainda (isso entra nas partes
-- 2 e 3, Edge Function + gatilhos/cron).

-- =========================================================
-- 1. Inscrições push (uma linha por navegador/aparelho que ativou)
-- =========================================================
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);
create index on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "usuario_le_propria_subscription" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "usuario_insere_propria_subscription" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "usuario_deleta_propria_subscription" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
-- Sem policy de update de propósito: o front sempre faz upsert por
-- (user_id, endpoint) — nunca precisa de um update de verdade. Quem
-- apaga subscription morta (404/410 do provedor de push) é a Edge
-- Function, usando a service role, que já ignora RLS.

-- =========================================================
-- 2. Log de despacho — evita mandar a mesma notificação 2x
-- =========================================================
create table public.push_notification_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'incident_created', 'alert_created', 'client_at_risk',
    'meeting_reminder_1h', 'meeting_reminder_15m', 'smart_goal_overdue'
  )),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (kind, entity_id)
);
create index on public.push_notification_log (entity_id);

alter table public.push_notification_log enable row level security;
-- De propósito: nenhuma policy criada aqui — mesmo padrão já usado em
-- oauth_tokens (migration-016-fase6-integracoes-fundacao.sql): RLS
-- ligado + zero políticas = ninguém autenticado/anônimo lê ou escreve,
-- só a service role (Edge Function) mexe nessa tabela.

-- =========================================================
-- 3. "Cliente em risco" — mesma regra de src/lib/client-risk.ts
--    (computeClientHasProblems), traduzida pra SQL porque o cron
--    precisa conseguir checar isso sem nenhum navegador aberto. Se
--    mudar uma, mudar a outra também.
-- =========================================================
create or replace function public.compute_at_risk_client_ids()
returns table(client_id uuid)
language sql stable security definer set search_path = public
as $$
  with overdue_goals as (
    select distinct sg.client_id from public.smart_goals sg
    where sg.status <> 'completed' and sg.target_date is not null and sg.target_date < current_date
  ),
  incident_agg as (
    select i.client_id,
      count(*) filter (where i.severity = 'medium') as medium_count,
      count(*) filter (where i.severity in ('high', 'critical')) as high_crit_count
    from public.incidents i
    where i.status in ('open', 'in_progress')
    group by i.client_id
  ),
  overdue_tasks as (
    select t.client_id, count(*) as overdue_count from public.tasks t
    where t.status <> 'done' and t.due_date is not null and t.due_date < current_date
    group by t.client_id
  ),
  alert_agg as (
    select a.client_id,
      count(*) filter (where a.severity = 'medium') as medium_count,
      count(*) filter (where a.severity in ('high', 'critical')) as high_crit_count
    from public.alerts a
    where a.resolved = false
    group by a.client_id
  )
  select c.id from public.clients c
  where exists (select 1 from overdue_goals g where g.client_id = c.id)
     or coalesce((select medium_count from incident_agg i where i.client_id = c.id), 0) >= 2
     or coalesce((select high_crit_count from incident_agg i where i.client_id = c.id), 0) >= 1
     or coalesce((select overdue_count from overdue_tasks t where t.client_id = c.id), 0) >= 4
     or coalesce((select medium_count from alert_agg a where a.client_id = c.id), 0) >= 2
     or coalesce((select high_crit_count from alert_agg a where a.client_id = c.id), 0) >= 1;
$$;

grant execute on function public.compute_at_risk_client_ids() to authenticated;

-- Compara o "em risco" de agora com o log: apaga quem não está mais em
-- risco (libera pra notificar de novo numa futura reentrada) e
-- insere+devolve só quem ficou em risco AGORA (transição, não estado).
-- Retorno chamado "id" (não "entity_id") de propósito: dentro de uma
-- função plpgsql, um parâmetro de saída com o MESMO nome de uma coluna
-- real usada no corpo da função (aqui, push_notification_log.entity_id
-- dentro do "on conflict (kind, entity_id)") gera erro de ambiguidade
-- ("column reference is ambiguous") — Postgres não sabe se é a
-- variável ou a coluna. RETURN QUERY casa por posição/tipo, não por
-- nome, então renomear o parâmetro de saída resolve sem mudar a query.
create or replace function public.detect_new_at_risk_clients()
returns table(id uuid)
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  delete from public.push_notification_log l
  where l.kind = 'client_at_risk'
    and not exists (select 1 from public.compute_at_risk_client_ids() r where r.client_id = l.entity_id);

  return query
  insert into public.push_notification_log (kind, entity_id)
  select 'client_at_risk', r.client_id from public.compute_at_risk_client_ids() r
  on conflict (kind, entity_id) do nothing
  returning push_notification_log.entity_id;
end;
$$;

grant execute on function public.detect_new_at_risk_clients() to authenticated;

-- =========================================================
-- 4. Metas SMART atrasadas — mesma regra de getGoalDeadlineStatus
--    (src/lib/format.ts): status <> 'completed' e target_date no passado.
-- =========================================================
create or replace function public.detect_new_overdue_goals()
returns table(id uuid)
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  return query
  insert into public.push_notification_log (kind, entity_id)
  select 'smart_goal_overdue', g.id from public.smart_goals g
  where g.status <> 'completed' and g.target_date is not null and g.target_date < current_date
  on conflict (kind, entity_id) do nothing
  returning push_notification_log.entity_id;
end;
$$;

grant execute on function public.detect_new_overdue_goals() to authenticated;

-- =========================================================
-- 5. Lembretes de reunião — baseado em janela (não no minuto exato),
--    pra tolerar cron atrasado/em manutenção sem duplicar disparo; a
--    constraint unique(kind, entity_id) garante 1 disparo só por
--    reunião em cada janela.
-- =========================================================
create or replace function public.detect_new_meeting_reminders_1h()
returns table(id uuid)
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  return query
  insert into public.push_notification_log (kind, entity_id)
  select 'meeting_reminder_1h', m.id from public.meetings m
  where m.status = 'scheduled' and m.date > now() and m.date <= now() + interval '1 hour'
  on conflict (kind, entity_id) do nothing
  returning push_notification_log.entity_id;
end;
$$;

grant execute on function public.detect_new_meeting_reminders_1h() to authenticated;

create or replace function public.detect_new_meeting_reminders_15m()
returns table(id uuid)
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  return query
  insert into public.push_notification_log (kind, entity_id)
  select 'meeting_reminder_15m', m.id from public.meetings m
  where m.status = 'scheduled' and m.date > now() and m.date <= now() + interval '15 minutes'
  on conflict (kind, entity_id) do nothing
  returning push_notification_log.entity_id;
end;
$$;

grant execute on function public.detect_new_meeting_reminders_15m() to authenticated;

create index on public.meetings (date) where status = 'scheduled';

-- =========================================================
-- 6. Gatilhos de limpeza — se a reunião for remarcada, ou a meta tiver
--    o prazo/status mudado, apaga o registro de dedup correspondente,
--    pra não ficar bloqueado pra sempre de notificar de novo numa
--    mudança legítima.
-- =========================================================
create or replace function public.clear_meeting_reminder_log()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if NEW.date is distinct from OLD.date then
    delete from public.push_notification_log
    where entity_id = NEW.id and kind in ('meeting_reminder_1h', 'meeting_reminder_15m');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_meetings_clear_reminder_log on public.meetings;
create trigger trg_meetings_clear_reminder_log
  after update on public.meetings
  for each row execute procedure public.clear_meeting_reminder_log();

create or replace function public.clear_goal_overdue_log()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if NEW.target_date is distinct from OLD.target_date or NEW.status is distinct from OLD.status then
    delete from public.push_notification_log
    where entity_id = NEW.id and kind = 'smart_goal_overdue';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_smart_goals_clear_overdue_log on public.smart_goals;
create trigger trg_smart_goals_clear_overdue_log
  after update on public.smart_goals
  for each row execute procedure public.clear_goal_overdue_log();
