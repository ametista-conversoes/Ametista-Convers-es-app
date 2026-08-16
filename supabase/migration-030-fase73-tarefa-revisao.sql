-- Ametista Conversões — Fase 7.3: pedir revisão de uma aprovação passa
-- a criar uma tarefa de revisão automaticamente pra agência.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Antes, "Pedir revisão" (migration-014) só atualizava o status da
-- aprovação e guardava o feedback do cliente — nada avisava a agência
-- que precisava mexer em algo. Agora, além disso, nasce uma tarefa
-- (mesmo padrão de apply_workflow: status inicial, sem projeto porque
-- approvals não tem project_id, e um registro em audit_logs pra
-- rastreabilidade).

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
  elsif new_status = 'revision_requested' then
    insert into public.tasks (title, category, client_id, status, priority)
    values ('Revisar: ' || approval_title, 'revisão', approval_client_id, 'todo', 'high');

    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Cliente pediu revisão de "' || approval_title || '" — tarefa de revisão criada', 'approval', approval_id, approval_client_id, 'medium');
  end if;
end;
$$;
