-- Ametista Conversões — alerta automático quando uma campanha
-- vinculada muda de estado (pausada/removida) ou tem o orçamento
-- alterado bruscamente. Só faz sentido agora que a sincronização
-- grava dado de verdade por campanha (Fase 32 — project_campaign_links).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Seguro
-- rodar de novo mesmo se você já rodou uma versão anterior.

alter table public.project_campaign_links
  add column if not exists last_known_status text,
  add column if not exists last_known_budget numeric;

alter table public.campaign_performance_snapshots
  add column if not exists campaign_status text;

-- Compara o status/orçamento mais recente sincronizado de cada
-- campanha vinculada (campaign_performance_snapshots, mais recente por
-- connection_id+external_campaign_id) contra o último valor conhecido
-- guardado em project_campaign_links — se mudou pra PAUSED/REMOVED, ou
-- o orçamento mudou mais de 20%, cria um Alerta. Sempre atualiza
-- last_known_* no final do loop (mudando ou não), pra nunca alertar a
-- mesma transição duas vezes — diferente de check_metric_alert_thresholds
-- (que reavalia uma condição persistente a cada vez), aqui é um evento
-- pontual: 1 alerta por transição de verdade, não por sincronização.
create or replace function public.check_campaign_state_changes()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  link record;
  latest record;
  v_title text;
  v_severity public.severity_level;
begin
  if public.current_user_role() is not null and public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  for link in select * from public.project_campaign_links loop
    select cps.campaign_status, cps.budget_amount, cps.client_id
    into latest
    from public.campaign_performance_snapshots cps
    where cps.connection_id = link.connection_id
      and cps.external_campaign_id = link.external_campaign_id
    order by cps.snapshot_date desc
    limit 1;

    if not found then continue; end if;

    -- Mudança de status — só alerta em transições de verdade (já
    -- tinha um status conhecido diferente do atual), não na 1ª leitura
    -- depois de vincular a campanha.
    if link.last_known_status is not null and latest.campaign_status is not null
       and link.last_known_status is distinct from latest.campaign_status
       and latest.campaign_status in ('PAUSED', 'REMOVED') then
      v_title := 'Campanha "' || coalesce(link.external_campaign_name, link.external_campaign_id) || '" mudou de estado';
      v_severity := case when latest.campaign_status = 'REMOVED' then 'high' else 'medium' end;
      insert into public.alerts (title, message, client_id, severity, category)
      values (
        v_title,
        'Status mudou de ' || link.last_known_status || ' para ' || latest.campaign_status || '.',
        latest.client_id,
        v_severity::public.severity_level,
        'campanha_mudou_estado'
      );
    end if;

    -- Orçamento mudou mais de 20% em relação ao último valor
    -- conhecido.
    if link.last_known_budget is not null and latest.budget_amount is not null and link.last_known_budget > 0
       and abs(latest.budget_amount - link.last_known_budget) / link.last_known_budget > 0.2 then
      insert into public.alerts (title, message, client_id, severity, category)
      values (
        'Orçamento da campanha "' || coalesce(link.external_campaign_name, link.external_campaign_id) || '" mudou bruscamente',
        'Orçamento foi de ' || round(link.last_known_budget, 2) || ' pra ' || round(latest.budget_amount, 2) || '.',
        latest.client_id,
        'medium'::public.severity_level,
        'campanha_mudou_estado'
      );
    end if;

    update public.project_campaign_links
    set last_known_status = coalesce(latest.campaign_status, last_known_status),
        last_known_budget = coalesce(latest.budget_amount, last_known_budget)
    where id = link.id;
  end loop;
end;
$$;

grant execute on function public.check_campaign_state_changes() to authenticated;
