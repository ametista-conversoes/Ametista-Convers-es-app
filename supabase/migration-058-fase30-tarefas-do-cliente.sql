-- Ametista Conversões — Fase 30: separa as tarefas que o cliente vê no
-- próprio Portal Cliente das tarefas internas do Kanban da agência.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Causa raiz corrigida: até agora, `/tasks` (Portal Cliente) e o
-- checklist de `/project` liam a MESMA tabela `public.tasks` que o
-- Kanban interno usa, só filtrada por client_id — então tarefas
-- puramente internas da agência (ex: "Assinatura de contrato") apareciam
-- pro cliente, e tarefas que o cliente criava pra si mesmo apareciam no
-- Kanban interno. `client_tasks` é uma tabela nova e totalmente
-- separada — o Kanban (`public.tasks`) não muda em nada.

-- =========================================================
-- 1. Tabela nova — mesmo formato de public.tasks, reaproveitando os
--    mesmos enums (task_status/task_priority) já existentes.
-- =========================================================
create table public.client_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  status public.task_status not null default 'backlog',
  priority public.task_priority not null default 'medium',
  due_date date,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.client_tasks (client_id);

create trigger set_updated_at before update on public.client_tasks
  for each row execute procedure public.set_updated_at();

alter table public.client_tasks enable row level security;

create policy "admin_gestor_full_client_tasks" on public.client_tasks for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));

create policy "cliente_le_proprias_client_tasks" on public.client_tasks for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

create policy "cliente_cria_proprias_client_tasks" on public.client_tasks for insert
  with check (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

create policy "cliente_apaga_proprias_client_tasks" on public.client_tasks for delete
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- =========================================================
-- 2. Troca de status pelo próprio cliente — mesma cautela de
--    set_task_status (migration-007), só que apontando pra client_tasks.
-- =========================================================
create or replace function public.set_client_task_status(task_id uuid, new_status text)
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

  select client_id into task_client_id from public.client_tasks where id = task_id;

  if task_client_id is null then
    raise exception 'Tarefa não encontrada';
  end if;

  if public.current_user_role() = 'cliente' and task_client_id <> public.current_user_client_id() then
    raise exception 'Não autorizado';
  elsif public.current_user_role() not in ('admin', 'gestor', 'cliente') then
    raise exception 'Não autorizado';
  end if;

  update public.client_tasks set status = new_status::task_status where id = task_id;
end;
$$;

grant execute on function public.set_client_task_status(uuid, text) to authenticated;

-- =========================================================
-- 3. apply_workflow ganha um destino: 'kanban' (padrão, tabela tasks,
--    comportamento de sempre) ou 'client_tasks' (tarefas do cliente).
--    O restante da função (audit_log, activity_template_ids →
--    activity_checklist_items) não muda — é um conceito à parte.
-- =========================================================
create or replace function public.apply_workflow(
  p_client_id uuid,
  p_project_id uuid,
  p_workflow_name text,
  p_steps jsonb,
  p_activity_template_ids uuid[] default '{}',
  p_target text default 'kanban'
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  step jsonb;
  v_due_date date;
  v_client_plan text;
  v_activity_template_id uuid;
  v_activity_items jsonb;
  v_activity_name text;
  activity_item jsonb;
  v_item_scope jsonb;
  i int;
begin
  if public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  if p_target not in ('kanban', 'client_tasks') then
    raise exception 'Destino inválido';
  end if;

  select plan into v_client_plan from public.clients where id = p_client_id;

  for step in select * from jsonb_array_elements(p_steps)
  loop
    v_due_date := case
      when (step ->> 'due_days') is not null
        then ((now() at time zone 'America/Sao_Paulo')::date + ((step ->> 'due_days')::int))
      else null
    end;

    if p_target = 'client_tasks' then
      insert into public.client_tasks (title, category, client_id, project_id, status, due_date)
      values (step ->> 'title', step ->> 'category', p_client_id, p_project_id, 'backlog', v_due_date);
    else
      insert into public.tasks (title, category, client_id, project_id, status, due_date)
      values (step ->> 'title', step ->> 'category', p_client_id, p_project_id, 'backlog', v_due_date);
    end if;
  end loop;

  insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
  values ('Workflow "' || p_workflow_name || '" aplicado', 'project', p_project_id, p_client_id, 'low');

  i := 0;
  foreach v_activity_template_id in array p_activity_template_ids
  loop
    select name, items into v_activity_name, v_activity_items
      from public.activity_templates where id = v_activity_template_id;
    if v_activity_items is null then
      continue;
    end if;

    for activity_item in select * from jsonb_array_elements(v_activity_items)
    loop
      v_item_scope := activity_item -> 'plan_scope';
      if v_client_plan is not null and v_item_scope is not null and not (v_item_scope ? v_client_plan) then
        i := i + 1;
        continue;
      end if;

      insert into public.activity_checklist_items
        (client_id, project_id, title, category, step_order, source_activity_template_id, source_template_name)
      values
        (p_client_id, p_project_id, activity_item ->> 'title', activity_item ->> 'category', i,
         v_activity_template_id, v_activity_name);
      i := i + 1;
    end loop;
  end loop;
end;
$$;
