-- Ametista Conversões — Fase 6.6.2: "Onboarding" vira "Atividades".
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Não apaga onboarding_steps nem toggle_onboarding_step (ficam paradas,
-- sem uso, sem risco de perder dado — mesma cautela da Fase 6.5.6 com
-- incidents/alerts).

-- =========================================================
-- 1. Workflows de Atividades — checklists reaproveitáveis (texto
--    simples, marcado na mão). Mesma forma/RLS de
--    client_workflow_templates (migration-021).
-- =========================================================
create table public.activity_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  items jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.activity_templates
  for each row execute procedure public.set_updated_at();

alter table public.activity_templates enable row level security;

create policy "admin_full_activity_templates" on public.activity_templates for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "gestor_le_activity_templates" on public.activity_templates for select
  using (public.current_user_role() in ('admin', 'gestor'));

-- Garante no máximo um modelo padrão, sem depender de constraint —
-- zera os outros e marca só o escolhido.
create or replace function public.set_default_activity_template(p_template_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'Não autorizado';
  end if;

  update public.activity_templates set is_default = false where is_default;
  update public.activity_templates set is_default = true where id = p_template_id;
end;
$$;

grant execute on function public.set_default_activity_template(uuid) to authenticated;

-- =========================================================
-- 2. Itens já instanciados por cliente (o que aparece na aba
--    Atividades) — nascem a partir de um Workflow de Atividades
--    (aplicado junto com um Workflow do Kanban, ou o padrão no
--    cadastro do cliente) ou são criados avulsos, na mão.
-- =========================================================
create table public.activity_checklist_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  category text,
  completed boolean not null default false,
  step_order integer not null default 0,
  source_activity_template_id uuid references public.activity_templates (id) on delete set null,
  source_template_name text,
  created_at timestamptz not null default now()
);

create index on public.activity_checklist_items (client_id);

alter table public.activity_checklist_items enable row level security;

create policy "admin_gestor_full_activity_checklist_items" on public.activity_checklist_items for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));

-- =========================================================
-- 3. Workflows do Kanban (workflow_templates) passam a poder carregar
--    Workflows de Atividades vinculados — ao aplicar o workflow, os
--    itens desses checklists nascem junto das tarefas de sempre.
-- =========================================================
alter table public.workflow_templates
  add column if not exists activity_template_ids uuid[] not null default '{}';

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
  v_activity_template_id uuid;
  v_activity_items jsonb;
  v_activity_name text;
  activity_item jsonb;
  i int;
begin
  if public.current_user_role() not in ('admin', 'gestor') then
    raise exception 'Não autorizado';
  end if;

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
-- 4. Modelo padrão aplicado sozinho a todo cliente novo, assim que é
--    cadastrado (qualquer status, não só "onboarding").
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
  i int := 0;
begin
  select id, name, items into v_template_id, v_name, v_items
    from public.activity_templates where is_default limit 1;

  if v_template_id is null then
    return new;
  end if;

  for item in select * from jsonb_array_elements(v_items)
  loop
    insert into public.activity_checklist_items
      (client_id, project_id, title, category, step_order, source_activity_template_id, source_template_name)
    values
      (new.id, null, item ->> 'title', item ->> 'category', i, v_template_id, v_name);
    i := i + 1;
  end loop;

  return new;
end;
$$;

create trigger trg_apply_default_activity_template
  after insert on public.clients
  for each row execute function public.handle_new_client_activity_template();
