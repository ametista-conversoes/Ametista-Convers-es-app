-- Ametista Conversões — Fase 31: clientes do plano Validação escolhem
-- uma única plataforma de anúncio (Meta ou Google), e o checklist de
-- Atividades passa a mostrar só o que é relevante pra essa plataforma.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Diferença importante em relação ao plan_scope da Fase 29: lá, a
-- filtragem acontece só no momento de aplicar o Workflow (decide se cria
-- o item ou não). Aqui a filtragem precisa reagir a trocar a plataforma
-- DEPOIS que os itens já existem — por isso `platform_scope` mora no
-- item já instanciado (`activity_checklist_items`), não só no template,
-- e o item é sempre criado (a plataforma só decide se ele aparece).

-- =========================================================
-- 1. Plataforma escolhida pelo cliente — só relevante quando plan =
--    'validacao'; fica null pros outros planos e enquanto não definida.
-- =========================================================
alter table public.clients
  add column chosen_platform text check (chosen_platform is null or chosen_platform in ('meta', 'google'));

-- =========================================================
-- 2. platform_scope no item já instanciado — 'comum' (padrão seguro,
--    aparece pra todo mundo) até o usuário marcar os itens reais.
-- =========================================================
alter table public.activity_checklist_items
  add column platform_scope text not null default 'comum' check (platform_scope in ('comum', 'meta', 'google'));

-- Backfill dos itens dos templates (jsonb) — mesmo padrão da
-- migration-054 pro plan_scope: só adiciona quando ainda não tiver.
update public.activity_templates
set items = (
  select coalesce(jsonb_agg(
    case
      when item ? 'platform_scope' then item
      else item || jsonb_build_object('platform_scope', 'comum')
    end
  ), '[]'::jsonb)
  from jsonb_array_elements(items) as item
)
where items <> '[]'::jsonb;

-- =========================================================
-- 3. apply_workflow / handle_new_client_activity_template — copiam
--    platform_scope do template pro item instanciado. O item é sempre
--    criado (platform_scope não filtra criação, só exibição).
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
        (client_id, project_id, title, category, step_order, source_activity_template_id, source_template_name, platform_scope)
      values
        (p_client_id, p_project_id, activity_item ->> 'title', activity_item ->> 'category', i,
         v_activity_template_id, v_activity_name, coalesce(activity_item ->> 'platform_scope', 'comum'));
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
      (client_id, project_id, title, category, step_order, source_activity_template_id, source_template_name, platform_scope)
    values
      (new.id, null, item ->> 'title', item ->> 'category', i, v_template_id, v_name, coalesce(item ->> 'platform_scope', 'comum'));
    i := i + 1;
  end loop;

  return new;
end;
$$;

-- =========================================================
-- 4. Trava no banco: mesmo que alguém tente marcar um item via API
--    direto, se o cliente for Validação e o item não for da plataforma
--    escolhida (nem "comum"), rejeita.
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

  if v_plan = 'validacao' and new.platform_scope <> 'comum' and new.platform_scope is distinct from v_chosen_platform then
    raise exception 'Esse item não é da plataforma escolhida por este cliente';
  end if;

  return new;
end;
$$;

create trigger trg_check_activity_item_platform_match
  before update of completed on public.activity_checklist_items
  for each row execute procedure public.check_activity_item_platform_match();
