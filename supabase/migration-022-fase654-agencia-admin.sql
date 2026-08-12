-- Ametista Conversões — Fase 6.5.4: edição dos dados da agência
-- restrita ao admin (gestor continua podendo ver, só não editar).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

drop policy if exists "admin_gestor_full_organizations" on public.organizations;

create policy "admin_full_organizations" on public.organizations for all
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "gestor_le_organizations" on public.organizations for select
  using (public.current_user_role() in ('admin', 'gestor'));
