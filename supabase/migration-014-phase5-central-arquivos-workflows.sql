-- Ametista Conversões — Central de Informações do Cliente, Arquivos/
-- Aprovações no Portal Gestor, e a ligação automática entre aprovar um
-- arquivo e ele aparecer na aba Arquivos.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- =========================================================
-- 1. Novos campos do cliente (Central de Informações)
-- =========================================================
alter table public.clients add column phone text;
alter table public.clients add column logo_url text;
alter table public.clients add column renewal_date date;
-- Observação interna da agência — nunca deve ser exposta ao próprio
-- cliente (o front-end do Portal Cliente precisa listar as colunas
-- explicitamente ao ler "clients", sem usar select('*')).
alter table public.clients add column internal_notes text;

-- =========================================================
-- 2. Bucket de Storage para a logo do cliente — público (a logo
--    aparece em vários lugares do app, não precisa de link assinado
--    como os arquivos privados do cliente). Só admin/gestor sobem.
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('client-logos', 'client-logos', true, 5242880) -- 5MB por logo
on conflict (id) do nothing;

create policy "admin_gestor_full_client_logos" on storage.objects for all
  using (bucket_id = 'client-logos' and public.current_user_role() in ('admin', 'gestor'))
  with check (bucket_id = 'client-logos' and public.current_user_role() in ('admin', 'gestor'));

-- =========================================================
-- 3. Aprovar um arquivo agora também cria a entrada em "file_items" —
--    hoje "respond_to_approval" só atualizava o status da aprovação, e
--    o arquivo nunca aparecia em lugar nenhum depois de aprovado.
-- =========================================================
create or replace function public.respond_to_approval(approval_id uuid, new_status text, feedback_text text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  approval_client_id uuid;
  approval_title text;
  approval_file_url text;
  approval_file_type text;
begin
  if new_status not in ('approved', 'rejected', 'revision_requested') then
    raise exception 'Status inválido';
  end if;

  select client_id, title, file_url, file_type
    into approval_client_id, approval_title, approval_file_url, approval_file_type
    from public.approvals where id = approval_id;

  if approval_client_id is null then
    raise exception 'Aprovação não encontrada';
  end if;

  if public.current_user_role() = 'cliente' and approval_client_id <> public.current_user_client_id() then
    raise exception 'Não autorizado';
  elsif public.current_user_role() not in ('admin', 'gestor', 'cliente') then
    raise exception 'Não autorizado';
  end if;

  update public.approvals set status = new_status::review_status, feedback = feedback_text where id = approval_id;

  if new_status = 'approved' then
    insert into public.file_items (name, client_id, file_url, file_type, status)
    values (approval_title, approval_client_id, approval_file_url, approval_file_type, 'approved');
  end if;
end;
$$;
