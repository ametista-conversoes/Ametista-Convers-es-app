-- Ametista Conversões — corrige um buraco real deixado pela Fase 30
-- (migration-058): ela deu ao "Workflow Operacional" (apply_workflow) um
-- destino "client_tasks" (aparece no Portal Cliente), mas esqueceu de
-- atualizar a função irmã "Workflows do Cliente" (apply_client_workflow,
-- Fase 6.5.2/migration-021) do mesmo jeito — apesar do próprio diálogo
-- já dizer "direto na aba Tarefas de cada um", ela sempre gravou em
-- public.tasks (Kanban interno da agência), nunca em client_tasks. Por
-- isso aplicar um Workflow do Cliente nunca aparecia pro cliente.
--
-- Decisão do usuário: "Workflows do Cliente" passa a ser o único caminho
-- pra mandar tarefa pro Portal Cliente — o "Workflow Operacional" volta
-- a ser só interno (o destino "client_tasks" dele é removido, tanto na
-- validação da função quanto na tela).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- =========================================================
-- 1. apply_client_workflow passa a gravar em client_tasks (não mais em
--    public.tasks) — sem outra mudança de comportamento.
-- =========================================================
create or replace function public.apply_client_workflow(p_client_ids uuid[], p_template_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text;
  v_steps jsonb;
  v_client_id uuid;
  step jsonb;
  v_due_date date;
begin
  if public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

  select name, steps into v_name, v_steps from public.client_workflow_templates where id = p_template_id;
  if v_name is null then
    raise exception 'Modelo não encontrado';
  end if;

  foreach v_client_id in array p_client_ids
  loop
    for step in select * from jsonb_array_elements(v_steps)
    loop
      v_due_date := case
        when (step ->> 'due_days') is not null
          then ((now() at time zone 'America/Sao_Paulo')::date + ((step ->> 'due_days')::int))
        else null
      end;

      insert into public.client_tasks (title, category, client_id, project_id, status, due_date)
      values (step ->> 'title', step ->> 'category', v_client_id, null, 'backlog', v_due_date);
    end loop;

    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Workflow de cliente "' || v_name || '" aplicado', 'client', v_client_id, v_client_id, 'low');
  end loop;
end;
$$;

-- =========================================================
-- 2. apply_workflow (Workflow Operacional) perde o destino
--    "client_tasks" — só cria tarefas internas do Kanban daqui pra
--    frente (com ou sem projeto vinculado).
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

  if p_target <> 'kanban' then
    raise exception 'Destino inválido — o Workflow Operacional só cria tarefas internas do Kanban. Pra mandar tarefa pro Portal Cliente, use Workflows do Cliente.';
  end if;

  select plan into v_client_plan from public.clients where id = p_client_id;

  for step in select * from jsonb_array_elements(p_steps)
  loop
    v_due_date := case
      when (step ->> 'due_days') is not null
        then ((now() at time zone 'America/Sao_Paulo')::date + ((step ->> 'due_days')::int))
      else null
    end;

    insert into public.tasks (title, category, client_id, project_id, status, due_date)
    values (step ->> 'title', step ->> 'category', p_client_id, p_project_id, 'backlog', v_due_date);
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
