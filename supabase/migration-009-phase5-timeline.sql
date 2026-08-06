-- Ametista Conversões — Fase 5.3: Incidentes, Alertas e Timeline
-- (Portal do Gestor + conexão com o Portal do Cliente)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Rode DEPOIS
-- do migration-008-phase4-settings.sql.

-- =========================================================
-- 1. Registro automático na Timeline (audit_logs) quando um incidente
--    é criado ou resolvido. Fica na própria tabela — não tem como criar
--    ou resolver um incidente sem isso ser registrado.
-- =========================================================
create or replace function public.log_incident_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Incidente criado: ' || NEW.title, 'incident', NEW.id, NEW.client_id, NEW.severity);
  elsif TG_OP = 'UPDATE' and NEW.status = 'resolved' and OLD.status <> 'resolved' then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Incidente resolvido: ' || NEW.title, 'incident', NEW.id, NEW.client_id, NEW.severity);
  end if;
  return NEW;
end;
$$;

create trigger trg_incidents_audit
  after insert or update on public.incidents
  for each row execute procedure public.log_incident_event();

-- =========================================================
-- 2. Mesma ideia para alertas.
-- =========================================================
create or replace function public.log_alert_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Alerta criado: ' || NEW.title, 'alert', NEW.id, NEW.client_id, NEW.severity);
  elsif TG_OP = 'UPDATE' and NEW.resolved = true and OLD.resolved = false then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Alerta resolvido: ' || NEW.title, 'alert', NEW.id, NEW.client_id, NEW.severity);
  end if;
  return NEW;
end;
$$;

create trigger trg_alerts_audit
  after insert or update on public.alerts
  for each row execute procedure public.log_alert_event();

-- =========================================================
-- 3. Botão "Pausa de Emergência" do Portal Cliente — cria um incidente
--    crítico para o próprio cliente da conta logada. O trigger acima
--    cuida sozinho de registrar isso na Timeline.
-- =========================================================
create or replace function public.trigger_emergency_pause()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
begin
  select client_id into v_client_id from public.profiles where id = auth.uid();

  if v_client_id is null then
    raise exception 'Esta conta não está vinculada a um cliente';
  end if;

  insert into public.incidents (title, client_id, severity, status, category)
  values ('Pausa de emergência solicitada pelo cliente', v_client_id, 'critical', 'open', 'Pausa de Emergência');
end;
$$;

grant execute on function public.trigger_emergency_pause() to authenticated;

-- =========================================================
-- 4. Aplicar workflow — substitui o "insert" direto feito no front na
--    Fase 5.2: agora cria as tarefas e registra o evento na Timeline
--    numa transação só.
-- =========================================================
create or replace function public.apply_workflow(
  p_client_id uuid,
  p_project_id uuid,
  p_workflow_name text,
  p_steps jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  step jsonb;
begin
  if public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  for step in select * from jsonb_array_elements(p_steps)
  loop
    insert into public.tasks (title, category, client_id, project_id, status)
    values (step ->> 'title', step ->> 'category', p_client_id, p_project_id, 'backlog');
  end loop;

  insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
  values ('Workflow "' || p_workflow_name || '" aplicado', 'project', p_project_id, p_client_id, 'low');
end;
$$;

grant execute on function public.apply_workflow(uuid, uuid, text, jsonb) to authenticated;
