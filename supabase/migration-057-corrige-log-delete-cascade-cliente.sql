-- Ametista Conversões — corrige o 409 (Conflict) real ao apagar um
-- cliente que tenha Meta SMART, Reunião, Ativo Digital, Incidente ou
-- Alerta.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Causa raiz (migration-036): cada uma dessas 5 tabelas tem um gatilho
-- BEFORE DELETE que grava um `audit_logs` novo com `client_id = OLD.client_id`.
-- Isso funciona numa exclusão isolada (o cliente ainda existe). Mas ao
-- apagar o CLIENTE, o Postgres primeiro remove a linha de `clients`
-- (disparando `trg_clients_audit_delete`, que grava "Cliente X excluído"
-- normalmente) e só DEPOIS cascateia a exclusão pras tabelas filhas —
-- nesse momento o cliente já não existe mais em `clients`, então o
-- INSERT desses 5 gatilhos filhos tenta gravar um `audit_logs` com
-- `client_id` apontando pra um cliente que acabou de sumir, violando a
-- própria FK de `audit_logs.client_id` (23503) — o Postgres devolve
-- isso como 409 Conflict, e a exclusão inteira do cliente é desfeita.
--
-- Correção: cada gatilho passa a tentar gravar o log e, se der
-- exatamente essa violação de FK (sinal de que é uma exclusão em
-- cascata do próprio cliente), simplesmente ignora — o evento "Cliente
-- X excluído" (gravado por `trg_clients_audit_delete`, que roda ANTES e
-- continua funcionando normal) já documenta a ação. Numa exclusão
-- isolada de uma Meta/Reunião/Ativo/Incidente/Alerta (cliente
-- continua existindo), o log continua sendo gravado normalmente, sem
-- mudança de comportamento.

create or replace function public.log_smart_goal_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  begin
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Meta "' || OLD.title || '" excluída', 'smart_goal', OLD.id, OLD.client_id, 'medium');
  exception when foreign_key_violation then
    null;
  end;
  return OLD;
end;
$$;

create or replace function public.log_meeting_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  begin
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Reunião "' || OLD.title || '" excluída', 'meeting', OLD.id, OLD.client_id, 'low');
  exception when foreign_key_violation then
    null;
  end;
  return OLD;
end;
$$;

create or replace function public.log_digital_asset_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  begin
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Ativo digital "' || OLD.name || '" excluído', 'digital_asset', OLD.id, OLD.client_id, 'medium');
  exception when foreign_key_violation then
    null;
  end;
  return OLD;
end;
$$;

create or replace function public.log_incident_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  begin
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Incidente excluído: ' || OLD.title, 'incident', OLD.id, OLD.client_id, OLD.severity);
  exception when foreign_key_violation then
    null;
  end;
  return OLD;
end;
$$;

create or replace function public.log_alert_delete_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  begin
    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Alerta excluído: ' || OLD.title, 'alert', OLD.id, OLD.client_id, OLD.severity);
  exception when foreign_key_violation then
    null;
  end;
  return OLD;
end;
$$;
