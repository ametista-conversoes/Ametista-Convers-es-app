-- Ametista Conversões — Fase 19.2: corrige um bug real de fuso horário
-- encontrado auditando o `current_date`/fuso usado no banco.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- O banco roda em UTC por padrão (nenhuma migração anterior mudou
-- isso). A agência é de Manaus (America/Manaus, UTC-4, sem horário de
-- verão), não de Brasília/São Paulo (America/Sao_Paulo, UTC-3) — as
-- funções que já convertiam pra fuso local (`apply_workflow`,
-- `apply_client_workflow`, `request_emergency_meeting`) estavam
-- convertendo pro fuso errado; e três outras (Health Score, "Cliente
-- em risco", "Meta atrasada") não convertiam fuso nenhum, usando
-- `current_date`/`now()` puro (UTC). Esta migração corrige as duas
-- coisas de uma vez, todas pra `America/Manaus`.
--
-- Efeito prático do bug do current_date puro: das 20h às 00h (horário
-- de Manaus) — já 00h-04h UTC do dia seguinte — o banco achava que
-- "hoje" já tinha virado o dia seguinte até 4 horas antes da hora
-- certa. Nessa janela diária, uma meta/tarefa com prazo pra "hoje"
-- (Manaus) já era contada como atrasada, o Health Score já pontuava
-- como se tivesse passado do prazo, e o cliente podia entrar em
-- "Cliente em risco" (com notificação push) cedo demais. O frontend
-- (`src/lib/client-risk.ts`, via `getTodayIsoDate()` em
-- `src/lib/format.ts`) já usa o fuso de quem está vendo a tela, então
-- esse bug específico NÃO existe lá — só no espelho em SQL que o cron
-- usa (`compute_at_risk_client_ids`).

-- =========================================================
-- 1. Health Score (migration-029) — meta atrasada, tendência de ROAS
--    (15 dias vs 15 anteriores), janela de renovação, gasto/receita
--    recentes, tarefas atrasadas.
-- =========================================================
create or replace function public.recompute_client_health_score(p_client_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Manaus')::date;
  v_status public.client_status;
  v_renewal_date date;
  v_performance numeric;
  v_financeiro numeric;
  v_entrega numeric;
  v_relacionamento numeric;
  v_overall numeric;
  v_sum numeric := 0;
  v_count integer := 0;

  v_goal_avg numeric;
  v_trend_score numeric;
  v_recent_roas numeric;
  v_previous_roas numeric;

  v_base numeric;
  v_roi_penalty numeric := 0;
  v_recent_spend numeric;
  v_recent_revenue numeric;

  v_task_count integer;
  v_overdue_tasks integer;
  v_task_score numeric;
  v_activity_total integer;
  v_activity_done integer;
  v_activity_score numeric;

  v_relacionamento_score numeric := 100;
  v_auto_approved integer;
  v_cancelled_meetings integer;
  v_severe_incidents integer;
  v_severe_alerts integer;
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  select status, renewal_date into v_status, v_renewal_date from public.clients where id = p_client_id;
  if not found then
    return;
  end if;

  select avg(
    greatest(0,
      (case status
        when 'completed' then 100
        when 'on_track' then 85
        when 'at_risk' then 55
        when 'off_track' then 25
      end)
      - (case when status <> 'completed' and target_date is not null and target_date < v_today then 20 else 0 end)
    )
  )
  into v_goal_avg
  from public.smart_goals
  where client_id = p_client_id;

  select avg(roas) into v_recent_roas
    from public.performance_snapshots
    where client_id = p_client_id and snapshot_date >= v_today - 15;
  select avg(roas) into v_previous_roas
    from public.performance_snapshots
    where client_id = p_client_id and snapshot_date >= v_today - 30 and snapshot_date < v_today - 15;

  if v_recent_roas is not null and v_previous_roas is not null and v_previous_roas > 0 then
    v_trend_score := case
      when v_recent_roas >= v_previous_roas * 0.95 then 90
      when v_recent_roas >= v_previous_roas * 0.80 then 60
      else 30
    end;
  else
    v_trend_score := null;
  end if;

  if v_goal_avg is not null and v_trend_score is not null then
    v_performance := (v_goal_avg + v_trend_score) / 2;
  else
    v_performance := coalesce(v_goal_avg, v_trend_score);
  end if;

  v_base := case v_status
    when 'active' then 100
    when 'onboarding' then 90
    when 'paused' then 45
    when 'churned' then 0
  end;

  if v_status in ('active', 'onboarding') and v_renewal_date is not null and v_renewal_date <= v_today + 15 then
    v_base := greatest(0, v_base - 20);
  end if;

  select sum(spend), sum(revenue) into v_recent_spend, v_recent_revenue
    from public.performance_snapshots
    where client_id = p_client_id and snapshot_date >= v_today - 30;

  if v_recent_spend is not null and v_recent_spend > 0 and v_recent_revenue is not null and v_recent_revenue < v_recent_spend then
    v_roi_penalty := 15;
  end if;

  v_financeiro := greatest(0, v_base - v_roi_penalty);

  select count(*) into v_task_count from public.tasks where client_id = p_client_id;
  select count(*) into v_overdue_tasks
    from public.tasks
    where client_id = p_client_id and status <> 'done' and due_date is not null and due_date < v_today;

  if v_task_count > 0 then
    v_task_score := greatest(0, 100 - v_overdue_tasks * 15);
  else
    v_task_score := null;
  end if;

  select count(*), count(*) filter (where completed) into v_activity_total, v_activity_done
    from public.activity_checklist_items
    where client_id = p_client_id;

  if v_activity_total > 0 then
    v_activity_score := (v_activity_done::numeric / v_activity_total) * 100;
  else
    v_activity_score := null;
  end if;

  if v_task_score is not null and v_activity_score is not null then
    v_entrega := (v_task_score + v_activity_score) / 2;
  else
    v_entrega := coalesce(v_task_score, v_activity_score);
  end if;

  select count(*) into v_auto_approved
    from public.approvals
    where client_id = p_client_id and auto_approved = true and updated_at >= now() - interval '90 days';
  v_relacionamento_score := v_relacionamento_score - least(40, v_auto_approved * 10);

  select count(*) into v_cancelled_meetings
    from public.meetings
    where client_id = p_client_id and status = 'cancelled' and date >= now() - interval '90 days';
  v_relacionamento_score := v_relacionamento_score - least(30, v_cancelled_meetings * 10);

  select count(*) into v_severe_incidents
    from public.incidents
    where client_id = p_client_id and status in ('open', 'in_progress') and severity in ('high', 'critical');
  v_relacionamento_score := v_relacionamento_score - least(45, v_severe_incidents * 15);

  select count(*) into v_severe_alerts
    from public.alerts
    where client_id = p_client_id and resolved = false and severity in ('high', 'critical');
  v_relacionamento_score := v_relacionamento_score - least(30, v_severe_alerts * 10);

  v_relacionamento := greatest(0, v_relacionamento_score);

  if v_performance is not null then v_sum := v_sum + v_performance; v_count := v_count + 1; end if;
  if v_financeiro is not null then v_sum := v_sum + v_financeiro; v_count := v_count + 1; end if;
  if v_entrega is not null then v_sum := v_sum + v_entrega; v_count := v_count + 1; end if;
  if v_relacionamento is not null then v_sum := v_sum + v_relacionamento; v_count := v_count + 1; end if;

  v_overall := case when v_count > 0 then round(v_sum / v_count) else null end;

  update public.clients
  set health_score = v_overall,
      health_performance = round(v_performance),
      health_financial = round(v_financeiro),
      health_delivery = round(v_entrega),
      health_relationship = round(v_relacionamento)
  where id = p_client_id;
end;
$$;

-- =========================================================
-- 2. "Cliente em risco" (migration-037) — mesma regra de
--    src/lib/client-risk.ts, que já é segura (usa o fuso de quem está
--    vendo a tela); só o espelho em SQL precisava do ajuste.
-- =========================================================
create or replace function public.compute_at_risk_client_ids()
returns table(client_id uuid)
language sql stable security definer set search_path = public
as $$
  with overdue_goals as (
    select distinct sg.client_id from public.smart_goals sg
    where sg.status <> 'completed' and sg.target_date is not null
      and sg.target_date < (now() at time zone 'America/Manaus')::date
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
    where t.status <> 'done' and t.due_date is not null
      and t.due_date < (now() at time zone 'America/Manaus')::date
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

-- =========================================================
-- 3. "Meta atrasada" (migration-037) — gatilho de notificação push.
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
  where g.status <> 'completed' and g.target_date is not null
    and g.target_date < (now() at time zone 'America/Manaus')::date
  on conflict (kind, entity_id) do nothing
  returning push_notification_log.entity_id;
end;
$$;

-- =========================================================
-- 4. Disponibilidade + reunião de emergência (migration-020) — já
--    convertia fuso, só estava no fuso errado (Brasília, não Manaus).
-- =========================================================
create or replace function public.request_emergency_meeting(p_date timestamptz, p_meeting_link text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
  v_plan text;
  v_weekday smallint;
  v_time_slot text;
  v_already_requested boolean;
  v_blocked boolean;
  v_meeting_id uuid;
begin
  if public.current_user_role() <> 'cliente' then
    raise exception 'Só clientes podem solicitar reunião de emergência';
  end if;
  v_client_id := public.current_user_client_id();

  select plan into v_plan from public.clients where id = v_client_id;
  if v_plan is distinct from 'dominacao' then
    raise exception 'Reunião de emergência disponível apenas para o plano Dominação';
  end if;

  select exists(
    select 1 from public.meetings
    where client_id = v_client_id and is_emergency = true
      and date_trunc('month', created_at) = date_trunc('month', now())
  ) into v_already_requested;
  if v_already_requested then
    raise exception 'Você já solicitou uma reunião de emergência este mês';
  end if;

  v_weekday := extract(dow from p_date at time zone 'America/Manaus');
  v_time_slot := to_char(p_date at time zone 'America/Manaus', 'HH24:MI');

  select exists(
    select 1 from public.manager_availability_blocks
    where weekday = v_weekday and time_slot = v_time_slot
  ) into v_blocked;
  if v_blocked then
    raise exception 'Esse horário não está disponível';
  end if;

  insert into public.meetings (title, client_id, date, meeting_link, status, is_emergency)
  values ('Reunião de emergência', v_client_id, p_date, p_meeting_link, 'scheduled', true)
  returning id into v_meeting_id;

  return v_meeting_id;
end;
$$;

-- =========================================================
-- 5. Prazo automático de Workflow (migration-021/025) — mesma
--    correção de fuso, nas duas funções que aplicam workflow (com
--    projeto, e direto no cliente).
-- =========================================================
create or replace function public.apply_workflow(
  p_client_id uuid,
  p_project_id uuid,
  p_workflow_name text,
  p_steps jsonb,
  p_activity_template_ids uuid[] default '{}'
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  step jsonb;
  v_due_date date;
  v_activity_template_id uuid;
  v_activity_items jsonb;
  v_activity_name text;
  activity_item jsonb;
  i int;
begin
  if public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  for step in select * from jsonb_array_elements(p_steps)
  loop
    v_due_date := case
      when (step ->> 'due_days') is not null
        then ((now() at time zone 'America/Manaus')::date + ((step ->> 'due_days')::int))
      else null
    end;

    insert into public.tasks (title, category, client_id, project_id, status, due_date)
    values (step ->> 'title', step ->> 'category', p_client_id, p_project_id, 'backlog', v_due_date);
  end loop;

  insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
  values ('Workflow "' || p_workflow_name || '" aplicado', 'project', p_project_id, p_client_id, 'low');

  foreach v_activity_template_id in array p_activity_template_ids
  loop
    select name, items into v_activity_name, v_activity_items
      from public.activity_templates where id = v_activity_template_id;
    if v_activity_items is null then
      continue;
    end if;

    i := 0;
    for activity_item in select * from jsonb_array_elements(v_activity_items)
    loop
      insert into public.activity_checklist_items
        (client_id, project_id, title, category, step_order, source_activity_template_id, source_template_name)
      values
        (p_client_id, p_project_id, activity_item ->> 'title', activity_item ->> 'category', i,
         v_activity_template_id, v_activity_name);
      i := i + 1;
    end loop;
  end loop;
end;
$$;

create or replace function public.apply_client_workflow(p_client_ids uuid[], p_template_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text;
  v_steps jsonb;
  v_client_id uuid;
  step jsonb;
  v_due_date date;
begin
  if public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  select name, steps into v_name, v_steps from public.client_workflow_templates where id = p_template_id;
  if v_name is null then
    raise exception 'Modelo não encontrado';
  end if;

  foreach v_client_id in array p_client_ids
  loop
    for step in select * from jsonb_array_elements(v_steps)
    loop
      v_due_date := case
        when (step ->> 'due_days') is not null
          then ((now() at time zone 'America/Manaus')::date + ((step ->> 'due_days')::int))
        else null
      end;

      insert into public.tasks (title, category, client_id, project_id, status, due_date)
      values (step ->> 'title', step ->> 'category', v_client_id, null, 'backlog', v_due_date);
    end loop;

    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Workflow de cliente "' || v_name || '" aplicado', 'client', v_client_id, v_client_id, 'low');
  end loop;
end;
$$;

-- Backfill: recalcula o Health Score de todo mundo agora, com a conta
-- corrigida (mesmo padrão da migration-029 original).
select public.recompute_all_client_health_scores();
