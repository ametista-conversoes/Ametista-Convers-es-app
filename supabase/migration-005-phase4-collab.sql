-- Ametista Conversões — Fase 4.3: Tarefas, Arquivos, Comentários e Reuniões
-- (Portal do Cliente)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Rode DEPOIS
-- do migration-004-phase4-project.sql.

-- =========================================================
-- 1. Comentários passam a guardar quem escreveu (hoje só guardava o
--    papel). O nome é gravado no momento do comentário: quem lê o feed
--    só consegue ler o próprio perfil (regra da Fase 2), então não tem
--    como "buscar o nome" de quem comentou — precisa estar salvo aqui.
-- =========================================================
alter table public.comments
  add column author_id uuid references auth.users (id),
  add column author_name text;

-- =========================================================
-- 2. Políticas novas de INSERT para o papel "cliente" — ele passa a
--    poder CRIAR os próprios registros (tarefa, comentário, reunião,
--    arquivo), sempre restrito ao próprio client_id.
-- =========================================================
create policy "cliente_cria_proprias_tasks" on public.tasks for insert
  with check (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

create policy "cliente_cria_proprios_comments" on public.comments for insert
  with check (
    public.current_user_role() = 'cliente'
    and client_id = public.current_user_client_id()
    and author_id = auth.uid()
    and entity_type = 'general'
  );

create policy "cliente_cria_proprias_meetings" on public.meetings for insert
  with check (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

create policy "cliente_cria_proprios_file_items" on public.file_items for insert
  with check (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- =========================================================
-- 3. Concluir tarefa — só altera o campo "status" (entre "done" e
--    "todo"), e só em tarefa do próprio cliente. Mesmo cuidado do
--    "toggle_onboarding_step" da Fase 4.2: evita abrir uma política de
--    UPDATE genérica que deixaria o cliente livre pra editar qualquer
--    campo (título, prioridade, categoria) de tarefas de outras pessoas.
-- =========================================================
create or replace function public.set_task_done(task_id uuid, is_done boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  task_client_id uuid;
begin
  select client_id into task_client_id from public.tasks where id = task_id;

  if task_client_id is null then
    raise exception 'Tarefa não encontrada';
  end if;

  if public.current_user_role() = 'cliente' and task_client_id <> public.current_user_client_id() then
    raise exception 'Não autorizado';
  elsif public.current_user_role() not in ('admin', 'gestor', 'cliente') then
    raise exception 'Não autorizado';
  end if;

  update public.tasks set status = case when is_done then 'done'::task_status else 'todo'::task_status end
  where id = task_id;
end;
$$;

grant execute on function public.set_task_done(uuid, boolean) to authenticated;

-- =========================================================
-- 4. Responder a uma aprovação — só aceita os 3 status de resposta do
--    cliente (não deixa voltar pra "pending" nem mudar título/arquivo).
-- =========================================================
create or replace function public.respond_to_approval(approval_id uuid, new_status text, feedback_text text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  approval_client_id uuid;
begin
  if new_status not in ('approved', 'rejected', 'revision_requested') then
    raise exception 'Status inválido';
  end if;

  select client_id into approval_client_id from public.approvals where id = approval_id;

  if approval_client_id is null then
    raise exception 'Aprovação não encontrada';
  end if;

  if public.current_user_role() = 'cliente' and approval_client_id <> public.current_user_client_id() then
    raise exception 'Não autorizado';
  elsif public.current_user_role() not in ('admin', 'gestor', 'cliente') then
    raise exception 'Não autorizado';
  end if;

  update public.approvals set status = new_status::review_status, feedback = feedback_text where id = approval_id;
end;
$$;

grant execute on function public.respond_to_approval(uuid, text, text) to authenticated;

-- =========================================================
-- 5. Storage — bucket privado para os arquivos trocados com cada
--    cliente. Caminho dos arquivos: "{client_id}/nome-do-arquivo".
--    Cada cliente só sobe/lê arquivos dentro da própria pasta.
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('client-files', 'client-files', false, 20971520) -- 20MB por arquivo
on conflict (id) do nothing;

create policy "cliente_sobe_proprios_arquivos" on storage.objects for insert
  with check (
    bucket_id = 'client-files'
    and public.current_user_role() = 'cliente'
    and (storage.foldername(name))[1] = public.current_user_client_id()::text
  );

create policy "cliente_le_proprios_arquivos" on storage.objects for select
  using (
    bucket_id = 'client-files'
    and public.current_user_role() = 'cliente'
    and (storage.foldername(name))[1] = public.current_user_client_id()::text
  );

create policy "admin_gestor_full_client_files" on storage.objects for all
  using (bucket_id = 'client-files' and public.current_user_role() in ('admin', 'gestor'))
  with check (bucket_id = 'client-files' and public.current_user_role() in ('admin', 'gestor'));
