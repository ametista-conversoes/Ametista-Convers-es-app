-- Ametista Conversões — Fase 21.2: alerta automático quando uma
-- métrica de um cliente passa de um limite configurável (por cliente,
-- configurado pelo gestor na Central de Informações do Cliente).

create table public.metric_alert_thresholds (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  metric text not null check (metric in ('cpa', 'roas', 'ctr', 'spend', 'revenue')),
  comparison text not null check (comparison in ('above', 'below')),
  threshold_value numeric not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, metric)
);

alter table public.metric_alert_thresholds enable row level security;

-- Só admin/gestor configura isso — cliente não vê nem edita (é
-- decisão da agência, não do cliente).
create policy "admin_gestor_full_metric_alert_thresholds" on public.metric_alert_thresholds for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));

-- Checa cada limiar ativo contra os últimos 7 dias de
-- performance_snapshots, com as MESMAS fórmulas já usadas no
-- front-end (aggregateSnapshotKpis/computeRevenueFromLeads/computeRoas
-- em src/lib/metrics.ts) — pra nunca disparar um alerta com um número
-- diferente do que o app mostra: CPA = gasto ÷ conversões, CTR =
-- (cliques ÷ impressões) × 100, Receita = (conversões ÷
-- leads_to_close) × average_ticket, ROAS = Receita ÷ gasto. Sem as
-- premissas de Receita configuradas no cliente, Receita/ROAS ficam
-- null e são ignorados (mesma regra do front-end). Cria um alerta em
-- `alerts` só se ainda não existir um não-resolvido igual (mesmo
-- client_id + título, título é determinístico por métrica+comparação)
-- — evita duplicar a cada sincronização (a cada poucas horas).
create or replace function public.check_metric_alert_thresholds()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  t record;
  agg record;
  metric_value numeric;
  metric_label text;
  v_title text;
  already_alerted boolean;
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  for t in select * from public.metric_alert_thresholds where enabled loop
    select
      coalesce(sum(spend), 0) as spend,
      coalesce(sum(clicks), 0) as clicks,
      coalesce(sum(impressions), 0) as impressions,
      coalesce(sum(conversions), 0) as conversions
    into agg
    from public.performance_snapshots
    where client_id = t.client_id
      and snapshot_date >= (current_date - interval '7 days');

    metric_value := case t.metric
      when 'spend' then agg.spend
      when 'cpa' then case when agg.conversions > 0 then agg.spend / agg.conversions else null end
      when 'ctr' then case when agg.impressions > 0 then (agg.clicks::numeric / agg.impressions) * 100 else null end
      when 'revenue' then (
        select case
          when c.leads_to_close is not null and c.leads_to_close > 0 and c.average_ticket is not null
          then (agg.conversions / c.leads_to_close) * c.average_ticket
          else null
        end
        from public.clients c where c.id = t.client_id
      )
      when 'roas' then (
        select case
          when c.leads_to_close is not null and c.leads_to_close > 0 and c.average_ticket is not null and agg.spend > 0
          then ((agg.conversions / c.leads_to_close) * c.average_ticket) / agg.spend
          else null
        end
        from public.clients c where c.id = t.client_id
      )
      else null
    end;

    if metric_value is null then continue; end if;

    if not (
      (t.comparison = 'above' and metric_value > t.threshold_value) or
      (t.comparison = 'below' and metric_value < t.threshold_value)
    ) then
      continue;
    end if;

    metric_label := case t.metric
      when 'cpa' then 'CPA'
      when 'roas' then 'ROAS'
      when 'ctr' then 'CTR'
      when 'spend' then 'Investimento'
      when 'revenue' then 'Receita'
      else t.metric
    end;
    v_title := metric_label || ' ' || (case t.comparison when 'above' then 'acima' else 'abaixo' end) || ' do limite configurado';

    select exists(
      select 1 from public.alerts
      where client_id = t.client_id and category = 'limiar_metrica' and resolved = false and title = v_title
    ) into already_alerted;

    if already_alerted then continue; end if;

    insert into public.alerts (title, message, client_id, severity, category)
    values (
      v_title,
      metric_label || ' nos últimos 7 dias: ' || round(metric_value, 2) ||
        ' (limite: ' || (case t.comparison when 'above' then 'acima de ' else 'abaixo de ' end) || t.threshold_value || ')',
      t.client_id,
      'medium'::public.severity_level,
      'limiar_metrica'
    );
  end loop;
end;
$$;

grant execute on function public.check_metric_alert_thresholds() to authenticated;
