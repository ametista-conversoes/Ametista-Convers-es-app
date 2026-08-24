-- Ametista Conversões — Fase 12.7: reunião concluída também pode ser
-- apagada (só admin/gestor), e regra de "quem cancela não apaga" —
-- quem apaga é sempre a outra parte.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- =========================================================
-- 1. Nova coluna: quem cancelou (não existia até agora)
-- =========================================================
alter table public.meetings add column cancelled_by_role public.user_role;

-- =========================================================
-- 2. cancel_meeting() passa a gravar quem cancelou
-- =========================================================
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
  set
    status = 'cancelled',
    cancellation_reason = coalesce(nullif(trim(reason), ''), 'Sem motivo informado'),
    cancelled_by_role = public.current_user_role()
  where id = meeting_id;
end;
$$;

-- =========================================================
-- 3. Cliente só apaga reunião cancelada PELA AGÊNCIA (admin OU gestor
--    — os dois lados da agência, nunca a que ele mesmo cancelou).
--    admin/gestor continuam com acesso total via
--    "admin_gestor_full_meetings" já existente; a regra "agência não
--    apaga o que ela mesma cancelou" fica só no front, já que a
--    política de admin/gestor é de propósito ampla (igual outras
--    tabelas do app).
-- =========================================================
drop policy if exists "cliente_apaga_propria_reuniao_cancelada" on public.meetings;

create policy "cliente_apaga_propria_reuniao_cancelada" on public.meetings for delete
  using (
    public.current_user_role() = 'cliente'
    and client_id = public.current_user_client_id()
    and status = 'cancelled'
    and cancelled_by_role in ('gestor', 'admin')
  );
