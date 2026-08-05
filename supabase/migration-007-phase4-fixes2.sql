-- Ametista Conversões — Mais ajustes na Fase 4.3 (Portal do Cliente)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Rode DEPOIS
-- do migration-006-phase4-fixes.sql.

-- =========================================================
-- Trocar o status de uma tarefa para qualquer um dos 5 valores válidos
-- (a "set_task_done" só trocava entre "done"/"todo" — o menu de status
-- da lista de tarefas precisa das outras opções também).
-- =========================================================
create or replace function public.set_task_status(task_id uuid, new_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  task_client_id uuid;
begin
  if new_status not in ('backlog', 'todo', 'in_progress', 'review', 'done') then
    raise exception 'Status inválido';
  end if;

  select client_id into task_client_id from public.tasks where id = task_id;

  if task_client_id is null then
    raise exception 'Tarefa não encontrada';
  end if;

  if public.current_user_role() = 'cliente' and task_client_id <> public.current_user_client_id() then
    raise exception 'Não autorizado';
  elsif public.current_user_role() not in ('admin', 'gestor', 'cliente') then
    raise exception 'Não autorizado';
  end if;

  update public.tasks set status = new_status::task_status where id = task_id;
end;
$$;

grant execute on function public.set_task_status(uuid, text) to authenticated;
