-- Ametista Conversões — Fase 29: Atividades filtradas por plano do cliente.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Contexto: cada item de `activity_templates.items` (jsonb) ganha um campo
-- `plan_scope` (array de texto, com os valores de `clients.plan`:
-- 'validacao'/'escala'/'dominacao'). Ao aplicar um Workflow de Atividades
-- (manual via apply_workflow, ou automático no cadastro de cliente novo via
-- handle_new_client_activity_template), só cria o item se o plano do
-- cliente estiver no plan_scope do item. Cliente sem plano definido (null)
-- ou item sem plan_scope (dado antigo) continua recebendo todos os itens —
-- fail open, mesmo comportamento de antes desta fase.

-- =========================================================
-- 1. Backfill: todo item já existente passa a ter os 3 planos marcados
--    (equivalente a "vale pra todos", o comportamento que já tinham).
-- =========================================================
update public.activity_templates
set items = (
  select coalesce(jsonb_agg(
    case
      when item ? 'plan_scope' then item
      else item || jsonb_build_object('plan_scope', '["validacao", "escala", "dominacao"]'::jsonb)
    end
  ), '[]'::jsonb)
  from jsonb_array_elements(items) as item
)
where items <> '[]'::jsonb;

-- =========================================================
-- 2. apply_workflow — filtra por item, não por workflow inteiro, então um
--    único Workflow de Atividades pode misturar itens de planos diferentes.
-- =========================================================
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

  foreach v_activity_template_id in array p_activity_template_ids
  loop
    select name, items into v_activity_name, v_activity_items
      from public.activity_templates where id = v_activity_template_id;
    if v_activity_items is null then
      continue;
    end if;

    i := 0;
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

-- =========================================================
-- 3. handle_new_client_activity_template — mesma checagem, agora usando o
--    plano do cliente recém-cadastrado (new.plan).
-- =========================================================
create or replace function public.handle_new_client_activity_template()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_template_id uuid;
  v_name text;
  v_items jsonb;
  item jsonb;
  v_item_scope jsonb;
  i int := 0;
begin
  select id, name, items into v_template_id, v_name, v_items
    from public.activity_templates where is_default limit 1;

  if v_template_id is null then
    return new;
  end if;

  for item in select * from jsonb_array_elements(v_items)
  loop
    v_item_scope := item -> 'plan_scope';
    if new.plan is not null and v_item_scope is not null and not (v_item_scope ? new.plan) then
      i := i + 1;
      continue;
    end if;

    insert into public.activity_checklist_items
      (client_id, project_id, title, category, step_order, source_activity_template_id, source_template_name)
    values
      (new.id, null, item ->> 'title', item ->> 'category', i, v_template_id, v_name);
    i := i + 1;
  end loop;

  return new;
end;
$$;
