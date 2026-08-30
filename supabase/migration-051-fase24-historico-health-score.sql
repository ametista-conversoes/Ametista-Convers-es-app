-- Ametista Conversões — Fase 24: histórico diário do Health Score por
-- cliente (Portal Gestor) — antes só existia o valor atual (recalculado
-- 1x/dia por `recompute_client_health_score`), sem nenhum histórico
-- salvo, então não dava pra ter clique-pra-detalhe com gráfico no card
-- "Health Score" de `ClientPerformanceMetricsCard.tsx` (Fase 23b),
-- diferente dos outros 10 KPIs do mesmo card.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

create table public.client_health_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  snapshot_date date not null,
  health_score integer,
  created_at timestamptz not null default now(),
  unique (client_id, snapshot_date)
);

alter table public.client_health_score_snapshots enable row level security;

create policy "admin_gestor_read_client_health_score_snapshots" on public.client_health_score_snapshots for select
  using (public.current_user_role() in ('admin', 'gestor'));

-- Recria `recompute_client_health_score` (corpo idêntico ao de
-- migration-043-fase19-fuso-horario-current-date.sql), só acrescentando
-- a captura do snapshot do dia logo após atualizar `clients` — assim o
-- snapshot é sempre gravado com o valor recém-calculado, tanto no cron
-- diário das 6h (`recompute-client-health-scores`) quanto no botão
-- manual "Recalcular agora", sem precisar de um cron novo e separado.
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

  insert into public.client_health_score_snapshots (client_id, snapshot_date, health_score)
  values (p_client_id, v_today, v_overall)
  on conflict (client_id, snapshot_date) do update set health_score = excluded.health_score;
end;
$$;

-- Recalcula todo mundo agora, já gravando o snapshot de hoje pra cada
-- cliente — sem isso, o gráfico ficaria sem nenhum ponto até o cron das
-- 6h da manhã rodar (mesmo padrão usado na Fase 23 pros KPIs executivos).
select public.recompute_all_client_health_scores();
