-- Ametista Conversões — Fase 7: Health Score real, calculado a partir
-- de dados reais (antes era só um número digitado manualmente).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". O
-- backfill no fim do arquivo já recalcula todo mundo na hora — não
-- precisa esperar o job agendado rodar pra ver os números certos.
--
-- Modelo: cada sub-nota (Desempenho/Financeiro/Entrega/Relacionamento)
-- começa em 100 e perde pontos por sinal negativo real — mesmo
-- raciocínio que src/lib/client-risk.ts já usa pra marcar "Cliente em
-- risco". Quando não existe nenhum dado pra uma sub-nota, ela fica
-- NULL ("sem dados") em vez de inventar um número. O Health Score
-- geral é a média das sub-notas que têm dado; se as 4 forem NULL, ele
-- também fica NULL.

create or replace function public.recompute_client_health_score(p_client_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
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
  -- Chamada tanto pelo botão "Recalcular agora" (usuário logado) quanto
  -- pelo job agendado (sem sessão nenhuma, current_user_role() vem
  -- NULL, e por isso essa checagem não bloqueia o cron — só bloqueia
  -- uma sessão de verdade que não seja admin/gestor).
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  select status, renewal_date into v_status, v_renewal_date from public.clients where id = p_client_id;
  if not found then
    return;
  end if;

  -- Desempenho: média das metas SMART (status + atraso) e tendência de
  -- ROAS (compara os últimos 15 dias com os 15 anteriores — evita
  -- depender de um valor "bom" fixo, que varia demais de cliente pra
  -- cliente).
  select avg(
    greatest(0,
      (case status
        when 'completed' then 100
        when 'on_track' then 85
        when 'at_risk' then 55
        when 'off_track' then 25
      end)
      - (case when status <> 'completed' and target_date is not null and target_date < current_date then 20 else 0 end)
    )
  )
  into v_goal_avg
  from public.smart_goals
  where client_id = p_client_id;

  select avg(roas) into v_recent_roas
    from public.performance_snapshots
    where client_id = p_client_id and snapshot_date >= current_date - 15;
  select avg(roas) into v_previous_roas
    from public.performance_snapshots
    where client_id = p_client_id and snapshot_date >= current_date - 30 and snapshot_date < current_date - 15;

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

  -- Financeiro: status do cliente + janela de risco de renovação + ROI
  -- recente (só entra se houver receita reportada).
  v_base := case v_status
    when 'active' then 100
    when 'onboarding' then 90
    when 'paused' then 45
    when 'churned' then 0
  end;

  if v_status in ('active', 'onboarding') and v_renewal_date is not null and v_renewal_date <= current_date + 15 then
    v_base := greatest(0, v_base - 20);
  end if;

  select sum(spend), sum(revenue) into v_recent_spend, v_recent_revenue
    from public.performance_snapshots
    where client_id = p_client_id and snapshot_date >= current_date - 30;

  if v_recent_spend is not null and v_recent_spend > 0 and v_recent_revenue is not null and v_recent_revenue < v_recent_spend then
    v_roi_penalty := 15;
  end if;

  v_financeiro := greatest(0, v_base - v_roi_penalty);

  -- Entrega: tarefas atrasadas + progresso das atividades (Fase 6.6.2).
  select count(*) into v_task_count from public.tasks where client_id = p_client_id;
  select count(*) into v_overdue_tasks
    from public.tasks
    where client_id = p_client_id and status <> 'done' and due_date is not null and due_date < current_date;

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

  -- Relacionamento: aprovações "por atraso", reuniões canceladas,
  -- incidentes/alertas graves ainda abertos. Sem nenhum sinal negativo
  -- em nenhuma categoria, fica 100 (aqui a ausência de problema já é
  -- um sinal bom, diferente de Desempenho).
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

  -- Geral: média das sub-notas que têm dado.
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

grant execute on function public.recompute_client_health_score(uuid) to authenticated;

create or replace function public.recompute_all_client_health_scores()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  c record;
begin
  for c in select id from public.clients loop
    perform public.recompute_client_health_score(c.id);
  end loop;
end;
$$;

create extension if not exists pg_cron;

-- 1x por dia (6h) — os sinais usados (metas, tarefas, atividades,
-- aprovações, reuniões, incidentes, alertas, desempenho) não mudam
-- rápido o bastante pra precisar de uma cadência maior; pra ver a nota
-- atualizar na hora depois de mexer em algo, use o botão "Recalcular
-- agora" na Central de Informações do Cliente.
select cron.schedule(
  'recompute-client-health-scores',
  '0 6 * * *',
  $$ select public.recompute_all_client_health_scores(); $$
);

-- Backfill: recalcula todo mundo agora, na hora de rodar esta
-- migração — sem isso, os números continuariam sendo os valores
-- antigos digitados manualmente até o próximo cron.
select public.recompute_all_client_health_scores();
