-- Ametista Conversões — status de cliente editável, exclusão de itens e
-- fluxo de cancelamento de reuniões.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
-- IMPORTANTE: rode este arquivo inteiro de uma vez só (o ALTER TYPE do
-- início precisa "confirmar" antes das linhas que usam o novo valor).

-- =========================================================
-- 1. Novo status manual de cliente: "Em risco"
-- =========================================================
alter type public.client_status add value if not exists 'at_risk';

-- =========================================================
-- 2. Apagar cliente vira exclusivo de admin
--    (a política antiga "admin_gestor_full_clients" também deixava o
--    gestor apagar clientes; agora select/insert/update continuam pros
--    dois papéis, mas o delete fica só com admin — mesmo padrão já
--    usado em workflow_templates)
-- =========================================================
drop policy if exists "admin_gestor_full_clients" on public.clients;

create policy "admin_gestor_select_clients" on public.clients for select
  using (public.current_user_role() in ('admin', 'gestor'));

create policy "admin_gestor_insert_clients" on public.clients for insert
  with check (public.current_user_role() in ('admin', 'gestor'));

create policy "admin_gestor_update_clients" on public.clients for update
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));

create policy "admin_delete_clients" on public.clients for delete
  using (public.current_user_role() = 'admin');

-- =========================================================
-- 3. Cliente pode apagar as próprias tarefas e arquivos
--    (hoje só existe leitura + criação; admin/gestor já podem apagar
--    qualquer um via "admin_gestor_full_tasks"/"admin_gestor_full_file_items")
-- =========================================================
create policy "cliente_apaga_proprias_tasks" on public.tasks for delete
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

create policy "cliente_apaga_proprios_file_items" on public.file_items for delete
  using (public.current_user_role() = 'cliente' and client_id = public.current_user_client_id());

-- =========================================================
-- 4. Reuniões: motivo do cancelamento + função de cancelar + apagar só
--    depois de cancelada
-- =========================================================
alter table public.meetings add column cancellation_reason text;

create or replace function public.cancel_meeting(meeting_id uuid, reason text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  meeting_client_id uuid;
begin
  select client_id into meeting_client_id from public.meetings where id = meeting_id;

  if meeting_client_id is null then
    raise exception 'Reunião não encontrada';
  end if;

  if public.current_user_role() = 'cliente' and meeting_client_id <> public.current_user_client_id() then
    raise exception 'Não autorizado';
  end if;

  if public.current_user_role() not in ('admin', 'gestor', 'cliente') then
    raise exception 'Não autorizado';
  end if;

  update public.meetings
  set status = 'cancelled', cancellation_reason = coalesce(nullif(trim(reason), ''), 'Sem motivo informado')
  where id = meeting_id;
end;
$$;

grant execute on function public.cancel_meeting(uuid, text) to authenticated;

-- Cliente só apaga uma reunião própria que já esteja cancelada — assim
-- as duas partes sempre sabem o motivo antes dela sumir da lista.
-- admin/gestor já podem apagar qualquer reunião via política existente.
create policy "cliente_apaga_propria_reuniao_cancelada" on public.meetings for delete
  using (
    public.current_user_role() = 'cliente'
    and client_id = public.current_user_client_id()
    and status = 'cancelled'
  );

