-- Ametista Conversões — Fase 6.5.2: prazo automático nas etapas de
-- workflow + workflows aplicáveis direto a clientes (sem projeto).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- =========================================================
-- 1. apply_workflow (já existe desde a Fase 5, migration-009) passa a
--    aceitar um campo opcional "due_days" em cada etapa — quando
--    presente, o prazo da tarefa é calculado sozinho (hoje + due_days
--    dias, no fuso da agência). Etapa sem "due_days" continua sem
--    prazo, igual sempre foi.
-- =========================================================
create or replace function public.apply_workflow(
  p_client_id uuid,
  p_project_id uuid,
  p_workflow_name text,
  p_steps jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  step jsonb;
  v_due_date date;
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
end;
$$;

-- =========================================================
-- 2. Workflows do Cliente: modelos aplicáveis direto a um ou mais
--    clientes (sem passar por um projeto) — segunda aba da página
--    Workflows. Mesma estrutura e mesma regra de acesso de
--    workflow_templates (admin cria/edita/apaga; admin+gestor leem e
--    aplicam).
-- =========================================================
create table public.client_workflow_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.client_workflow_templates
  for each row execute procedure public.set_updated_at();

alter table public.client_workflow_templates enable row level security;

create policy "admin_full_client_workflow_templates" on public.client_workflow_templates for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "gestor_le_client_workflow_templates" on public.client_workflow_templates for select
  using (public.current_user_role() in ('admin', 'gestor'));

-- Aplica um modelo de "Workflows do Cliente" a vários clientes de uma
-- vez — uma tarefa por etapa, por cliente, sem projeto (project_id
-- null), com o mesmo cálculo de prazo do apply_workflow.
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

      insert into public.tasks (title, category, client_id, project_id, status, due_date)
      values (step ->> 'title', step ->> 'category', v_client_id, null, 'backlog', v_due_date);
    end loop;

    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Workflow de cliente "' || v_name || '" aplicado', 'client', v_client_id, v_client_id, 'low');
  end loop;
end;
$$;

grant execute on function public.apply_client_workflow(uuid[], uuid) to authenticated;
