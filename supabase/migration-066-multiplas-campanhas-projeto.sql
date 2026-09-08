-- Ametista Conversões — múltiplas campanhas por projeto.
--
-- Até aqui um projeto só vinculava 1 campanha (projects.external_connection_id
-- /external_campaign_id/external_campaign_name). Vira um relacionamento
-- 1-pra-muitos: um projeto de verdade pode ter uma campanha de Search e
-- uma de Performance Max juntas, por exemplo. As 3 colunas antigas em
-- "projects" ficam (não são removidas nesta migration) — só param de
-- ser a fonte de verdade pro link; o backfill abaixo copia o que já
-- existia pra tabela nova, sem perder nada.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Seguro
-- rodar de novo mesmo se você já rodou uma versão anterior.

create table if not exists public.project_campaign_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  connection_id uuid not null references public.digital_asset_connections (id) on delete cascade,
  external_campaign_id text not null,
  external_campaign_name text,
  created_at timestamptz not null default now(),
  unique (project_id, connection_id, external_campaign_id)
);

create index if not exists project_campaign_links_project_id_idx
  on public.project_campaign_links (project_id);

alter table public.project_campaign_links enable row level security;

drop policy if exists "admin_gestor_full_project_campaign_links" on public.project_campaign_links;
create policy "admin_gestor_full_project_campaign_links" on public.project_campaign_links for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));

-- Backfill: migra o link único que já existia (se algum) pra tabela
-- nova, sem duplicar se essa migration já rodou antes.
insert into public.project_campaign_links (project_id, connection_id, external_campaign_id, external_campaign_name)
select id, external_connection_id, external_campaign_id, external_campaign_name
from public.projects
where external_campaign_id is not null and external_connection_id is not null
on conflict (project_id, connection_id, external_campaign_id) do nothing;
