-- Ametista Conversões — Ajuste na Pausa de Emergência (Portal do Cliente)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Rode DEPOIS
-- do migration-009-phase5-timeline.sql.

-- Troca a função sem parâmetros por uma que recebe o motivo e os
-- projetos escolhidos pelo cliente. Precisa remover a antiga primeiro
-- porque a assinatura (parâmetros) mudou.
drop function if exists public.trigger_emergency_pause();

create or replace function public.trigger_emergency_pause(p_reason text, p_project_ids uuid[])
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
  v_invalid_count integer;
begin
  select client_id into v_client_id from public.profiles where id = auth.uid();

  if v_client_id is null then
    raise exception 'Esta conta não está vinculada a um cliente';
  end if;

  if p_project_ids is null or array_length(p_project_ids, 1) is null then
    raise exception 'Selecione ao menos um projeto para pausar';
  end if;

  -- Confere que todos os projetos escolhidos são realmente do cliente
  -- da conta logada, antes de mudar qualquer coisa.
  select count(*) into v_invalid_count
  from unnest(p_project_ids) as pid
  where not exists (
    select 1 from public.projects where id = pid and client_id = v_client_id
  );

  if v_invalid_count > 0 then
    raise exception 'Um dos projetos selecionados não pertence a este cliente';
  end if;

  update public.projects set status = 'paused' where id = any(p_project_ids);

  insert into public.incidents (title, client_id, severity, status, category)
  values (
    'Pausa de emergência solicitada pelo cliente: ' || coalesce(nullif(trim(p_reason), ''), 'sem motivo informado'),
    v_client_id,
    'critical',
    'open',
    'Pausa de Emergência'
  );
end;
$$;

grant execute on function public.trigger_emergency_pause(text, uuid[]) to authenticated;
