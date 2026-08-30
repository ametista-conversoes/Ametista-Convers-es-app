-- Ametista Conversões — Fase 23: histórico diário dos 8 KPIs do
-- Dashboard Executivo (Portal Gestor) — antes eram calculados só ao
-- vivo (`computeExecutiveKpis`, src/lib/manager-metrics.ts), sem
-- nenhum histórico salvo, então não dava pra ter clique-pra-detalhe
-- com gráfico ali (diferente do Portal Cliente, que já tinha
-- performance_snapshots diário desde muito antes).

create table public.executive_kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  mrr_total numeric not null,
  active_clients integer not null,
  churn_rate numeric,
  open_incidents integer not null,
  at_risk_clients integer not null,
  workload integer not null,
  productivity numeric,
  managed_budget numeric not null,
  created_at timestamptz not null default now()
);

alter table public.executive_kpi_snapshots enable row level security;

create policy "admin_gestor_read_executive_kpi_snapshots" on public.executive_kpi_snapshots for select
  using (public.current_user_role() in ('admin', 'gestor'));

-- Recalcula as 8 métricas com as MESMAS regras de computeExecutiveKpis
-- (src/lib/manager-metrics.ts) e grava 1 linha do dia — upsert por
-- snapshot_date, rodar de novo no mesmo dia corrige em vez de duplicar.
create or replace function public.capture_executive_kpi_snapshot()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_total_clients integer;
  v_active_clients integer;
  v_churned_clients integer;
  v_mrr numeric;
  v_at_risk integer;
  v_open_incidents integer;
  v_total_tasks integer;
  v_open_tasks integer;
  v_done_tasks integer;
  v_managed_budget numeric;
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  select
    count(*),
    count(*) filter (where status = 'active'),
    count(*) filter (where status = 'churned'),
    coalesce(sum(monthly_fee) filter (where status = 'active'), 0),
    count(*) filter (where coalesce(health_score, 100) < 50)
  into v_total_clients, v_active_clients, v_churned_clients, v_mrr, v_at_risk
  from public.clients;

  select count(*) into v_open_incidents from public.incidents where status in ('open', 'in_progress');

  select
    count(*),
    count(*) filter (where status in ('backlog', 'todo', 'in_progress', 'review')),
    count(*) filter (where status = 'done')
  into v_total_tasks, v_open_tasks, v_done_tasks
  from public.tasks;

  select coalesce(sum(spend), 0) into v_managed_budget from public.projects where status = 'active';

  insert into public.executive_kpi_snapshots (
    snapshot_date, mrr_total, active_clients, churn_rate, open_incidents, at_risk_clients, workload, productivity, managed_budget
  ) values (
    current_date,
    v_mrr,
    v_active_clients,
    case when v_total_clients > 0 then (v_churned_clients::numeric / v_total_clients) * 100 else null end,
    v_open_incidents,
    v_at_risk,
    v_open_tasks,
    case when v_total_tasks > 0 then (v_done_tasks::numeric / v_total_tasks) * 100 else null end,
    v_managed_budget
  )
  on conflict (snapshot_date) do update set
    mrr_total = excluded.mrr_total,
    active_clients = excluded.active_clients,
    churn_rate = excluded.churn_rate,
    open_incidents = excluded.open_incidents,
    at_risk_clients = excluded.at_risk_clients,
    workload = excluded.workload,
    productivity = excluded.productivity,
    managed_budget = excluded.managed_budget;
end;
$$;

grant execute on function public.capture_executive_kpi_snapshot() to authenticated;

select cron.schedule(
  'capture-executive-kpi-snapshot',
  '0 3 * * *',
  $$ select public.capture_executive_kpi_snapshot(); $$
);

-- Captura já na hora de rodar a migration — sem isso, o gráfico
-- ficaria sem nenhum ponto até o cron rodar de madrugada.
select public.capture_executive_kpi_snapshot();
