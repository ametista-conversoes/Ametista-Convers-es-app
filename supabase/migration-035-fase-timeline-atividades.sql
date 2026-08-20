-- Ametista Conversões — registro automático na Timeline (audit_logs)
-- quando um item de Atividades é criado avulso (na tela "Atividades")
-- ou marcado como concluído. Mesmo padrão de log_incident_event()/
-- log_alert_event() (migration-009-phase5-timeline.sql).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

create or replace function public.log_activity_checklist_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Só item avulso (criado na mão) gera "Atividade criada" — itens
  -- que nascem em massa junto de um Workflow aplicado (têm
  -- source_activity_template_id preenchido) já ficam cobertos pela
  -- entrada "Workflow aplicado" que o próprio apply_workflow grava;
  -- uma entrada por item deixaria o Timeline poluído a cada workflow.
  if TG_OP = 'INSERT' and NEW.source_activity_template_id is null then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Atividade criada: ' || NEW.title, 'activity_checklist_item', NEW.id, NEW.client_id, 'low');
  elsif TG_OP = 'UPDATE' and NEW.completed = true and OLD.completed = false then
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Atividade concluída: ' || NEW.title, 'activity_checklist_item', NEW.id, NEW.client_id, 'low');
  end if;
  return NEW;
end;
$$;

create trigger trg_activity_checklist_items_audit
  after insert or update on public.activity_checklist_items
  for each row execute procedure public.log_activity_checklist_event();
