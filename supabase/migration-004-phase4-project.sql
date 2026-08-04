-- Ametista Conversões — Fase 4.2: Relatórios e Meu Projeto (Portal do Cliente)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Rode DEPOIS
-- do migration-003-phase4-dashboard.sql.

-- =========================================================
-- 1. Info do projeto para os cards de "Meu Projeto" — preenchidas
--    manualmente pelo gestor (a tela de edição vem na Fase 5).
-- =========================================================
alter table public.projects
  add column objective text,
  add column icp text,
  add column segment text;

-- =========================================================
-- 2. Função para o cliente marcar/desmarcar uma etapa do onboarding.
--    De propósito não existe uma política de UPDATE direta em
--    onboarding_steps para o papel "cliente" (mesmo cuidado já aplicado
--    em "profiles" na Fase 2): se qualquer cliente pudesse fazer UPDATE
--    livre na tabela, ele poderia alterar título, categoria ou até o
--    client_id da etapa via chamada direta à API. Esta função só permite
--    alterar o campo "completed", e só da própria etapa do cliente.
-- =========================================================
create or replace function public.toggle_onboarding_step(step_id uuid, is_completed boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  step_client_id uuid;
begin
  select client_id into step_client_id from public.onboarding_steps where id = step_id;

  if step_client_id is null then
    raise exception 'Etapa de onboarding não encontrada';
  end if;

  if public.current_user_role() = 'cliente' and step_client_id <> public.current_user_client_id() then
    raise exception 'Não autorizado';
  elsif public.current_user_role() not in ('admin', 'gestor', 'cliente') then
    raise exception 'Não autorizado';
  end if;

  update public.onboarding_steps set completed = is_completed where id = step_id;
end;
$$;

grant execute on function public.toggle_onboarding_step(uuid, boolean) to authenticated;
