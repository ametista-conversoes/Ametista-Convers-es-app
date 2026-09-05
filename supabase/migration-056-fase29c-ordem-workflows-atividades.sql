-- Ametista Conversões — corrige a ordem de aplicação de vários Workflows
-- de Atividades vinculados a um mesmo Workflow Operacional.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Causa raiz: `apply_workflow` reiniciava o contador `i` (usado como
-- `step_order`) do zero pra CADA Workflow de Atividades do array — então,
-- com 2+ workflows vinculados, os itens de cada um nasciam com
-- step_order 0, 1, 2... colidindo entre si. Como a tela de Atividades
-- ordena tudo só por `step_order` (`useActivityChecklistItems`), o
-- resultado da colisão de empates virava, na prática, uma ordem
-- imprevisível entre os workflows — não necessariamente a ordem em que
-- foram marcados/salvos. Corrige mantendo um único contador contínuo pra
-- todos os workflows do array, na ordem em que aparecem em
-- `activity_template_ids` — essa ordem agora também pode ser definida na
-- tela (arrastar pra reordenar em "Workflows de Atividades vinculados").

create or replace function public.apply_workflow(
  p_client_id uuid,
  p_project_id uuid,
  p_workflow_name text,
  p_steps jsonb,
  p_activity_template_ids uuid[] default '{}'
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
