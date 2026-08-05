-- Ametista Conversões — Fase 4.4: Configurações (Portal do Cliente)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Rode DEPOIS
-- do migration-007-phase4-fixes2.sql.

-- Telefone do usuário, editável na aba "Usuário" de Configurações.
alter table public.profiles add column phone text;

-- =========================================================
-- Atualizar o próprio nome/telefone — de propósito não existe uma
-- política de UPDATE aberta em "profiles" (decisão da Fase 2: evita que
-- alguém troque o próprio "role" ou "client_id" sozinho). Esta função só
-- altera full_name/phone, e só da própria linha (auth.uid() = id).
-- =========================================================
create or replace function public.update_own_profile(new_full_name text, new_phone text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set full_name = new_full_name, phone = new_phone where id = auth.uid();
end;
$$;

grant execute on function public.update_own_profile(text, text) to authenticated;
