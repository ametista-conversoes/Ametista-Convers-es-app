-- Ametista Conversões — Timeline completo: registra automaticamente
-- (audit_logs) todas as ações significativas que hoje não geravam
-- nenhum registro. Mesmo padrão de log_incident_event()/
-- log_alert_event() (migration-009-phase5-timeline.sql) — uma função
-- de gatilho por tabela, AFTER INSERT/UPDATE pra criação/mudança de
-- status, BEFORE DELETE pra exclusão (a linha ainda existe nesse
-- momento, dá pra registrar o nome/título antes de sumir).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- =========================================================
-- 1. Clientes
-- =========================================================
create or replace function public.log_client_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Cliente "' || NEW.name || '" criado', 'client', NEW.id, NEW.id, 'low');
  elsif TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Cliente "' || NEW.name || '" mudou de status: ' || OLD.status || ' → ' || NEW.status, 'client', NEW.id, NEW.id, 'medium');
  end if;
  return NEW;
end;
$$;

create trigger trg_clients_audit
  after insert or update on public.clients
  for each row execute procedure public.log_client_event();

create or replace function public.log_client_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
  values ('Cliente "' || OLD.name || '" excluído', 'client', OLD.id, OLD.id, 'high');
  return OLD;
end;
$$;

create trigger trg_clients_audit_delete
  before delete on public.clients
  for each row execute procedure public.log_client_delete_event();

-- =========================================================
-- 2. Projetos
-- =========================================================
create or replace function public.log_project_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Projeto "' || NEW.title || '" criado', 'project', NEW.id, NEW.client_id, 'low');
  elsif TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Projeto "' || NEW.title || '" mudou de status: ' || OLD.status || ' → ' || NEW.status, 'project', NEW.id, NEW.client_id, 'medium');
  end if;
  return NEW;
end;
$$;

create trigger trg_projects_audit
  after insert or update on public.projects
  for each row execute procedure public.log_project_event();

-- =========================================================
-- 3. Metas SMART
-- =========================================================
create or replace function public.log_smart_goal_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Meta "' || NEW.title || '" criada', 'smart_goal', NEW.id, NEW.client_id, 'low');
  elsif TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Meta "' || NEW.title || '" mudou de status: ' || OLD.status || ' → ' || NEW.status, 'smart_goal', NEW.id, NEW.client_id, 'medium');
  end if;
  return NEW;
end;
$$;

create trigger trg_smart_goals_audit
  after insert or update on public.smart_goals
  for each row execute procedure public.log_smart_goal_event();

create or replace function public.log_smart_goal_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
  values ('Meta "' || OLD.title || '" excluída', 'smart_goal', OLD.id, OLD.client_id, 'medium');
  return OLD;
end;
$$;

create trigger trg_smart_goals_audit_delete
  before delete on public.smart_goals
  for each row execute procedure public.log_smart_goal_delete_event();

-- =========================================================
-- 4. Reuniões — só cancelamento e exclusão (agendar/concluir é
--    rotina, não precisa virar registro)
-- =========================================================
create or replace function public.log_meeting_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and NEW.status = 'cancelled' and OLD.status <> 'cancelled' then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values (
      'Reunião "' || NEW.title || '" cancelada' || case when NEW.cancellation_reason is not null then ' — ' || NEW.cancellation_reason else '' end,
      'meeting', NEW.id, NEW.client_id, 'medium'
    );
  end if;
  return NEW;
end;
$$;

create trigger trg_meetings_audit
  after update on public.meetings
  for each row execute procedure public.log_meeting_event();

create or replace function public.log_meeting_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
  values ('Reunião "' || OLD.title || '" excluída', 'meeting', OLD.id, OLD.client_id, 'low');
  return OLD;
end;
$$;

create trigger trg_meetings_audit_delete
  before delete on public.meetings
  for each row execute procedure public.log_meeting_delete_event();

-- =========================================================
-- 5. Ativos Digitais
-- =========================================================
create or replace function public.log_digital_asset_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Ativo digital "' || NEW.name || '" criado', 'digital_asset', NEW.id, NEW.client_id, 'low');
  elsif TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Ativo digital "' || NEW.name || '" mudou de status: ' || OLD.status || ' → ' || NEW.status, 'digital_asset', NEW.id, NEW.client_id, 'medium');
  end if;
  return NEW;
end;
$$;

create trigger trg_digital_assets_audit
  after insert or update on public.digital_assets
  for each row execute procedure public.log_digital_asset_event();

create or replace function public.log_digital_asset_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
  values ('Ativo digital "' || OLD.name || '" excluído', 'digital_asset', OLD.id, OLD.client_id, 'medium');
  return OLD;
end;
$$;

create trigger trg_digital_assets_audit_delete
  before delete on public.digital_assets
  for each row execute procedure public.log_digital_asset_delete_event();

-- =========================================================
-- 6. Conexões de integração (Google Ads/Meta/Forms) — não tem
--    client_id direto, busca em digital_assets pelo digital_asset_id.
--    Erro de conexão sai com severidade "high" — é justamente o "deu
--    errado" que vale a pena rastrear.
-- =========================================================
create or replace function public.log_digital_asset_connection_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
  v_asset_name text;
  v_label text;
begin
  if TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    select client_id, name into v_client_id, v_asset_name from public.digital_assets where id = NEW.digital_asset_id;

    v_label := case NEW.status
      when 'connected' then 'conectada'
      when 'error' then 'com erro'
      when 'disconnected' then 'desconectada'
      else NEW.status
    end;

    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values (
      'Integração ' || NEW.provider || ' de "' || coalesce(v_asset_name, 'ativo removido') || '" ' || v_label,
      'digital_asset_connection', NEW.id, v_client_id,
      case when NEW.status = 'error' then 'high' else 'low' end
    );
  end if;
  return NEW;
end;
$$;

create trigger trg_digital_asset_connections_audit
  after update on public.digital_asset_connections
  for each row execute procedure public.log_digital_asset_connection_event();

-- =========================================================
-- 7. Aprovações — respond_to_approval (migration-030) já grava log
--    pra "revision_requested"; completa com "approved"/"rejected",
--    mesma função, só recriada com os 2 ramos novos.
-- =========================================================
create or replace function public.respond_to_approval(approval_id uuid, new_status text, feedback_text text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  approval_client_id uuid;
  approval_title text;
  approval_file_url text;
  approval_file_type text;
begin
  if new_status not in ('approved', 'rejected', 'revision_requested') then
    raise exception 'Status inválido';
  end if;

  select client_id, title, file_url, file_type
    into approval_client_id, approval_title, approval_file_url, approval_file_type
    from public.approvals where id = approval_id;

  if approval_client_id is null then
    raise exception 'Aprovação não encontrada';
  end if;

  if public.current_user_role() = 'cliente' and approval_client_id <> public.current_user_client_id() then
    raise exception 'Não autorizado';
  elsif public.current_user_role() not in ('admin', 'gestor', 'cliente') then
    raise exception 'Não autorizado';
  end if;

  update public.approvals set status = new_status::review_status, feedback = feedback_text where id = approval_id;

  if new_status = 'approved' then
    insert into public.file_items (name, client_id, file_url, file_type, status)
    values (approval_title, approval_client_id, approval_file_url, approval_file_type, 'approved');

    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Cliente aprovou "' || approval_title || '"', 'approval', approval_id, approval_client_id, 'low');
  elsif new_status = 'rejected' then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Cliente rejeitou "' || approval_title || '"', 'approval', approval_id, approval_client_id, 'medium');
  elsif new_status = 'revision_requested' then
    insert into public.tasks (title, category, client_id, status, priority)
    values ('Revisar: ' || approval_title, 'revisão', approval_client_id, 'todo', 'high');

    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Cliente pediu revisão de "' || approval_title || '" — tarefa de revisão criada', 'approval', approval_id, approval_client_id, 'medium');
  end if;
end;
$$;

-- =========================================================
-- 8. Incidentes e Alertas — criado/resolvido já existem
--    (migration-009); só falta exclusão.
-- =========================================================
create or replace function public.log_incident_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
  values ('Incidente excluído: ' || OLD.title, 'incident', OLD.id, OLD.client_id, OLD.severity);
  return OLD;
end;
$$;

create trigger trg_incidents_audit_delete
  before delete on public.incidents
  for each row execute procedure public.log_incident_delete_event();

create or replace function public.log_alert_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
  values ('Alerta excluído: ' || OLD.title, 'alert', OLD.id, OLD.client_id, OLD.severity);
  return OLD;
end;
$$;

create trigger trg_alerts_audit_delete
  before delete on public.alerts
  for each row execute procedure public.log_alert_delete_event();
