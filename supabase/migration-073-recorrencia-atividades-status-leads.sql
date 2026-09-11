-- Ametista Conversões — Fase 35: sistema de recorrência genérico pra
-- itens do Workflow de Atividades e do Workflow de Cliente (o item
-- "reaparece" sozinho depois de um intervalo, sem precisar reaplicar o
-- Workflow) + status de lead (Novo/Qualificado/Venda/Perdido) em cada
-- resposta de formulário sincronizada, alimentando o funil.
--
-- Design da recorrência: a MESMA linha cicla — nada é recriado. Marcar
-- como concluído grava `completed_at`; o item continua "concluído" até
-- `completed_at + intervalo` passar, aí volta a aparecer como pendente
-- sozinho (calculado no front, não precisa de cron nem trigger). O
-- intervalo em si pode ser um número fixo de dias (7/15/30) ou "a
-- cadência do plano do cliente" (reunião ou otimização) — nesse caso
-- resolvido a partir de `clients.plan` toda vez, então uma troca de
-- plano já muda o ritmo na hora, sem precisar reconfigurar o item.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Seguro
-- rodar de novo mesmo se você já rodou uma versão anterior.

-- =========================================================
-- 1. Colunas novas — recorrência em activity_checklist_items e
--    client_tasks; status de lead em form_responses.
-- =========================================================
alter table public.activity_checklist_items
  add column if not exists recurrence_interval text,
  add column if not exists completed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'activity_checklist_items_recurrence_check'
  ) then
    alter table public.activity_checklist_items
      add constraint activity_checklist_items_recurrence_check
      check (recurrence_interval is null or recurrence_interval in ('7', '15', '30', 'cadencia_reuniao', 'cadencia_otimizacao'));
  end if;
end $$;

alter table public.client_tasks
  add column if not exists recurrence_interval text,
  add column if not exists completed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'client_tasks_recurrence_check'
  ) then
    alter table public.client_tasks
      add constraint client_tasks_recurrence_check
      check (recurrence_interval is null or recurrence_interval in ('7', '15', '30', 'cadencia_reuniao', 'cadencia_otimizacao'));
  end if;
end $$;

alter table public.form_responses
  add column if not exists status text not null default 'novo';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'form_responses_status_check'
  ) then
    alter table public.form_responses
      add constraint form_responses_status_check
      check (status in ('novo', 'qualificado', 'venda', 'perdido'));
  end if;
end $$;

-- =========================================================
-- 2. RLS nova — o cliente passa a poder LER as próprias respostas de
--    formulário (pra tela nova "Leads" do Portal Cliente) e trocar o
--    status via RPC abaixo (nunca update direto na tabela).
-- =========================================================
drop policy if exists "cliente_le_proprias_form_responses" on public.form_responses;
create policy "cliente_le_proprias_form_responses" on public.form_responses for select
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

drop policy if exists "cliente_le_form_answers_proprias" on public.form_answers;
create policy "cliente_le_form_answers_proprias" on public.form_answers for select
  using (
    public.current_user_role() = 'cliente'
    and exists (
      select 1 from public.form_responses fr
      where fr.id = form_answers.response_id and fr.client_id = public.current_user_client_id()
    )
  );

-- `digital_asset_connections` não tem (e não deve ganhar) uma policy de
-- leitura pro papel "cliente" — a tabela guarda token de OAuth. Função
-- security definer resolve a checagem de dono sem abrir a tabela
-- inteira: dentro dela a checagem roda com o privilégio de quem criou a
-- função (mesmo dono das migrations), então ignora a RLS de
-- digital_asset_connections/digital_assets só pra essa pergunta pontual
-- ("essa conexão pertence a esse cliente?").
create or replace function public.form_connection_belongs_to_client(p_connection_id uuid, p_client_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.digital_asset_connections dac
    join public.digital_assets da on da.id = dac.digital_asset_id
    where dac.id = p_connection_id and da.client_id = p_client_id
  );
$$;

drop policy if exists "cliente_le_form_questions_proprias" on public.form_questions;
create policy "cliente_le_form_questions_proprias" on public.form_questions for select
  using (
    public.current_user_role() = 'cliente'
    and public.form_connection_belongs_to_client(form_questions.connection_id, public.current_user_client_id())
  );

-- =========================================================
-- 3. RPC pra trocar o status de um lead — gestor mexe em qualquer um,
--    cliente só nos próprios (mesmo padrão de set_client_task_status).
-- =========================================================
create or replace function public.set_form_response_status(p_response_id uuid, p_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_client_id uuid;
begin
  if p_status not in ('novo', 'qualificado', 'venda', 'perdido') then
    raise exception 'Status inválido';
  end if;

  select client_id into v_client_id from public.form_responses where id = p_response_id;
  if v_client_id is null then
    raise exception 'Resposta não encontrada';
  end if;

  if public.current_user_role() = 'cliente' and v_client_id <> public.current_user_client_id() then
    raise exception 'Não autorizado';
  elsif public.current_user_role() not in ('admin', 'gestor', 'cliente') then
    raise exception 'Não autorizado';
  end if;

  update public.form_responses set status = p_status where id = p_response_id;
end;
$$;

grant execute on function public.set_form_response_status(uuid, text) to authenticated;

-- =========================================================
-- 4. set_client_task_status passa a gravar completed_at sempre que o
--    novo status for "done" (inclusive quando já estava "done" — é
--    assim que o próprio ciclo de recorrência é "renovado": marcar de
--    novo só atualiza o carimbo de tempo, a linha nunca é duplicada).
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

  update public.client_tasks
  set status = new_status::task_status,
      completed_at = case when new_status = 'done' then now() else completed_at end
  where id = task_id;
end;
$$;

-- =========================================================
-- 5. apply_client_workflow, apply_workflow e
--    handle_new_client_activity_template passam a copiar o campo
--    "recurrence" de cada item/etapa do modelo (jsonb) pra
--    recurrence_interval na linha instanciada. apply_workflow também
--    corrige um bug real: a reescrita da Fase 34a (migration-070)
--    esqueceu de copiar platform_scope pro activity_checklist_items —
--    toda entrada criada por ela desde então nasceu com o default
--    {meta,google} (comum às 2 plataformas), ignorando qualquer item
--    marcado exclusivo de Meta ou Google só — corrigido junto aqui.
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

      insert into public.client_tasks (title, category, client_id, project_id, status, due_date, recurrence_interval)
      values (step ->> 'title', step ->> 'category', v_client_id, null, 'backlog', v_due_date, step ->> 'recurrence');
    end loop;

    insert into public.audit_logs (action, entity_type, entity_id, client_id, severity)
    values ('Workflow de cliente "' || v_name || '" aplicado', 'client', v_client_id, v_client_id, 'low');
  end loop;
end;
$$;

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

      select coalesce(array_agg(x), array['meta', 'google'])
        into v_platform_scope
        from jsonb_array_elements_text(activity_item -> 'platform_scope') as x;

      insert into public.activity_checklist_items
        (client_id, project_id, title, category, step_order, source_activity_template_id, source_template_name,
         platform_scope, recurrence_interval)
      values
        (p_client_id, p_project_id, activity_item ->> 'title', activity_item ->> 'category', i,
         v_activity_template_id, v_activity_name, v_platform_scope, activity_item ->> 'recurrence');
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
      (client_id, project_id, title, category, step_order, source_activity_template_id, source_template_name,
       platform_scope, recurrence_interval)
    values
      (new.id, null, item ->> 'title', item ->> 'category', i, v_template_id, v_name, v_platform_scope, item ->> 'recurrence');
    i := i + 1;
  end loop;

  return new;
end;
$$;
