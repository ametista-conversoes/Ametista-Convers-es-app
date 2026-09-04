-- Ametista Conversões — Fase 27: foto de perfil do usuário (avatar) +
-- exibir a logo do cliente já existente nos cards da lista de Clientes.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase, depois clique em "Run".

-- 1. Nova coluna, mesma ideia de clients.logo_url.
alter table public.profiles add column avatar_url text;

-- 2. Estende update_own_profile (Fase 4.4) pra também aceitar o
--    avatar — parâmetro novo com default null e coalesce, então quem
--    já chama a função só com nome/telefone (UserSettingsTab.tsx)
--    continua funcionando sem mudar nada, sem apagar o avatar.
create or replace function public.update_own_profile(new_full_name text, new_phone text, new_avatar_url text default null)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set full_name = new_full_name, phone = new_phone, avatar_url = coalesce(new_avatar_url, avatar_url)
  where id = auth.uid();
end;
$$;

-- 3. Bucket público novo (mesmo molde de client-logos, Fase 5.4) —
--    cada usuário só mexe na própria pasta (nome começa com o próprio
--    auth.uid()), diferente de client-logos que é só admin/gestor.
insert into storage.buckets (id, name, public, file_size_limit)
values ('user-avatars', 'user-avatars', true, 5242880) -- 5MB por avatar
on conflict (id) do nothing;

create policy "usuario_gerencia_proprio_avatar" on storage.objects for all
  using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
