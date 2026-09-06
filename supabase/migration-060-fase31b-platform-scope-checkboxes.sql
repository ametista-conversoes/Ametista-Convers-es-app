-- Ametista Conversões — Fase 31b: troca `platform_scope` de um valor
-- único ('comum'/'meta'/'google') pra um array de checkboxes
-- (['meta'] / ['google'] / ['meta','google']), igual ao `plan_scope` já
-- funciona (3 checkboxes, os 3 marcados = universal). Os dois marcados
-- = aparece pra qualquer plataforma escolhida (equivalente ao antigo
-- 'comum'); só um marcado = exclusivo daquela plataforma.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- =========================================================
-- 1. Converte a coluna já instanciada de text pra text[].
-- =========================================================
alter table public.activity_checklist_items alter column platform_scope drop default;
alter table public.activity_checklist_items drop constraint if exists activity_checklist_items_platform_scope_check;

alter table public.activity_checklist_items
  alter column platform_scope type text[]
  using (
    case
      when platform_scope = 'meta' then '{meta}'::text[]
      when platform_scope = 'google' then '{google}'::text[]
      else '{meta,google}'::text[]
    end
  );

alter table public.activity_checklist_items
  alter column platform_scope set default '{meta,google}'::text[];

alter table public.activity_checklist_items
  add constraint activity_checklist_items_platform_scope_check
  check (platform_scope <@ array['meta', 'google']::text[] and array_length(platform_scope, 1) > 0);

-- =========================================================
-- 2. Converte o platform_scope dos templates (jsonb) de string pra
--    array — mesmo backfill de sempre, "comum"/ausente vira os 2.
-- =========================================================
update public.activity_templates
set items = (
  select jsonb_agg(
    item || jsonb_build_object(
      'platform_scope',
      case item ->> 'platform_scope'
        when 'meta' then '["meta"]'::jsonb
        when 'google' then '["google"]'::jsonb
        else '["meta", "google"]'::jsonb
      end
    )
  )
  from jsonb_array_elements(items) as item
)
where items <> '[]'::jsonb;

-- =========================================================
-- 3. apply_workflow / handle_new_client_activity_template — copiam o
--    array em vez de um valor único.
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
  v_platform_scope text[];
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

      select coalesce(array_agg(x), array['meta', 'google'])
        into v_platform_scope
        from jsonb_array_elements_text(activity_item -> 'platform_scope') as x;

      insert into public.activity_checklist_items
        (client_id, project_id, title, category, step_order, source_activity_template_id, source_template_name, platform_scope)
      values
        (p_client_id, p_project_id, activity_item ->> 'title', activity_item ->> 'category', i,
         v_activity_template_id, v_activity_name, v_platform_scope);
      i := i + 1;
    end loop;
  end loop;
end;
$$;

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
  v_platform_scope text[];
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

    select coalesce(array_agg(x), array['meta', 'google'])
      into v_platform_scope
      from jsonb_array_elements_text(item -> 'platform_scope') as x;

    insert into public.activity_checklist_items
      (client_id, project_id, title, category, step_order, source_activity_template_id, source_template_name, platform_scope)
    values
      (new.id, null, item ->> 'title', item ->> 'category', i, v_template_id, v_name, v_platform_scope);
    i := i + 1;
  end loop;

  return new;
end;
$$;

-- =========================================================
-- 4. Trava no banco (mesma ideia de antes, agora com array).
-- =========================================================
create or replace function public.check_activity_item_platform_match()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_plan text;
  v_chosen_platform text;
begin
  if new.completed = old.completed then
    return new;
  end if;

  select plan, chosen_platform into v_plan, v_chosen_platform
    from public.clients where id = new.client_id;

  if v_plan = 'validacao'
     and coalesce(array_length(new.platform_scope, 1), 2) < 2
     and (v_chosen_platform is null or not (v_chosen_platform = any(new.platform_scope))) then
    raise exception 'Esse item não é da plataforma escolhida por este cliente';
  end if;

  return new;
end;
$$;
