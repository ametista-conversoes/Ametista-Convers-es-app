-- Ametista Conversões — Teste A/B de Campanhas (spec em
-- docs/interno/testes ab caampanhaa.md). Um projeto pode ser marcado
-- como um teste A/B, usando as campanhas já vinculadas a ele
-- (project_campaign_links, Fase 32) como variantes.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Seguro
-- rodar de novo mesmo se você já rodou uma versão anterior.

alter table public.projects
  add column if not exists test_type text not null default 'nenhum'
    check (test_type in ('nenhum', 'segmentacao', 'anuncio', 'campanha')),
  add column if not exists test_min_spend numeric;

-- Log manual de troca de anúncio (só usado quando test_type =
-- 'anuncio') — data + descrição livre por campanha vinculada, sem
-- verificação/sincronização automática do conteúdo do anúncio.
create table if not exists public.campaign_ad_change_log (
  id uuid primary key default gen_random_uuid(),
  campaign_link_id uuid not null references public.project_campaign_links (id) on delete cascade,
  changed_at date not null default current_date,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists campaign_ad_change_log_campaign_link_id_idx
  on public.campaign_ad_change_log (campaign_link_id);

alter table public.campaign_ad_change_log enable row level security;

drop policy if exists "admin_gestor_full_campaign_ad_change_log" on public.campaign_ad_change_log;
create policy "admin_gestor_full_campaign_ad_change_log" on public.campaign_ad_change_log for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
