-- Ametista Conversões — Fase 21.3: histórico mensal de métricas do
-- cliente (registro permanente, independente do dado diário bruto de
-- performance_snapshots) + fechamento automático todo início de mês,
-- pra alimentar o relatório em PDF na aba Relatórios do Portal Cliente.

create table public.client_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  ref_month date not null,
  spend numeric,
  revenue numeric,
  roas numeric,
  cpa numeric,
  ctr numeric,
  clicks bigint,
  impressions bigint,
  conversions bigint,
  health_score integer,
  generated_at timestamptz not null default now(),
  unique (client_id, ref_month)
);

alter table public.client_monthly_reports enable row level security;

create policy "client_read_own_monthly_reports" on public.client_monthly_reports for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

create policy "admin_gestor_read_monthly_reports" on public.client_monthly_reports for select
  using (public.current_user_role() in ('admin', 'gestor'));

-- Agrega performance_snapshots do mês pedido (por padrão, o mês
-- anterior ao atual) por cliente, com as MESMAS fórmulas já usadas no
-- front-end (aggregateSnapshotKpis/computeRevenueFromLeads/computeRoas
-- em src/lib/metrics.ts, e check_metric_alert_thresholds da Fase
-- 21.2) — CPA = gasto ÷ conversões, CTR = (cliques ÷ impressões) ×
-- 100, Receita = (conversões ÷ leads_to_close) × average_ticket
-- (null sem essas premissas configuradas no cliente), ROAS = Receita ÷
-- gasto. `health_score` grava o valor atual do cliente no momento do
-- fechamento (não é um histórico próprio, só uma referência). Faz
-- upsert (só recalcula quem já tem snapshot no mês pedido) — rodar de
-- novo pro mesmo mês corrige em vez de duplicar.
create or replace function public.generate_monthly_client_reports(p_ref_month date default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_ref_month date := date_trunc('month', coalesce(p_ref_month, current_date - interval '1 month'))::date;
  v_next_month date := (v_ref_month + interval '1 month')::date;
  c record;
  agg record;
  v_revenue numeric;
  v_roas numeric;
  v_health_score integer;
  v_leads_to_close numeric;
  v_average_ticket numeric;
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  for c in
    select distinct client_id from public.performance_snapshots
    where snapshot_date >= v_ref_month and snapshot_date < v_next_month
  loop
    select
      coalesce(sum(spend), 0) as spend,
      coalesce(sum(clicks), 0) as clicks,
      coalesce(sum(impressions), 0) as impressions,
      coalesce(sum(conversions), 0) as conversions
    into agg
    from public.performance_snapshots
    where client_id = c.client_id and snapshot_date >= v_ref_month and snapshot_date < v_next_month;

    select leads_to_close, average_ticket, health_score into v_leads_to_close, v_average_ticket, v_health_score
    from public.clients where id = c.client_id;

    v_revenue := case
      when v_leads_to_close is not null and v_leads_to_close > 0 and v_average_ticket is not null
      then (agg.conversions / v_leads_to_close) * v_average_ticket
      else null
    end;
    v_roas := case when v_revenue is not null and agg.spend > 0 then v_revenue / agg.spend else null end;

    insert into public.client_monthly_reports (
      client_id, ref_month, spend, revenue, roas, cpa, ctr, clicks, impressions, conversions, health_score
    ) values (
      c.client_id,
      v_ref_month,
      agg.spend,
      v_revenue,
      v_roas,
      case when agg.conversions > 0 then agg.spend / agg.conversions else null end,
      case when agg.impressions > 0 then (agg.clicks::numeric / agg.impressions) * 100 else null end,
      agg.clicks,
      agg.impressions,
      agg.conversions,
      v_health_score
    )
    on conflict (client_id, ref_month) do update set
      spend = excluded.spend,
      revenue = excluded.revenue,
      roas = excluded.roas,
      cpa = excluded.cpa,
      ctr = excluded.ctr,
      clicks = excluded.clicks,
      impressions = excluded.impressions,
      conversions = excluded.conversions,
      health_score = excluded.health_score,
      generated_at = now();
  end loop;
end;
$$;

grant execute on function public.generate_monthly_client_reports(date) to authenticated;

-- Cron — todo dia 1 às 03:00 UTC, fecha o mês anterior sozinho. Pura
-- agregação em SQL, sem chamada externa (Google/Meta), então roda
-- direto no Postgres, sem precisar de Edge Function/net.http_post.
select cron.schedule(
  'close-monthly-reports',
  '0 3 1 * *',
  $$ select public.generate_monthly_client_reports(); $$
);

-- Pra conferir que o job ficou agendado certinho:
--   select * from cron.job where jobname = 'close-monthly-reports';
-- Pra testar na hora, sem esperar o cron (mês pedido é opcional, usa o mês anterior por padrão):
--   select public.generate_monthly_client_reports('2026-08-01');
--   select * from public.client_monthly_reports order by ref_month desc;
