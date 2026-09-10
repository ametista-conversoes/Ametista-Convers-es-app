-- Fase 34 — Catálogo de Criativos e Segmentações: organização e
-- classificação de anúncios (texto/vídeo) e segmentações, sempre por
-- cliente específico (sem reaproveitamento entre clientes). Vídeo não
-- guarda o arquivo em si (navegador não abre arquivo local com um
-- clique) — só uma referência de texto (caminho/nome esperado) em
-- "conteudo", igual ao campo de texto do anúncio.
create table public.catalog_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  catalog_type text not null check (catalog_type in ('criativo', 'segmentacao')),
  -- só existe pra catalog_type = 'criativo' (texto ou vídeo); Segmentações
  -- não tem essa distinção.
  tipo text check (tipo in ('texto', 'video')),
  -- texto do anúncio, ou o caminho/nome esperado do arquivo de vídeo
  -- (ex: "ClienteX/Videos/anuncio_v3_final.mp4") — nunca o arquivo em si.
  conteudo text not null,
  origem text not null check (origem in ('ia', 'forms', 'manual')),
  status text not null default 'rascunho'
    check (status in ('rascunho', 'em_teste', 'aprovado_implementado', 'descartado')),
  prioridade text not null default 'media' check (prioridade in ('alta', 'media', 'baixa')),
  -- variação opcional de outra entrada do MESMO cliente/catálogo que já
  -- deu certo (ex: "variação do Anúncio #12, mudando o gancho inicial").
  derivado_de uuid references public.catalog_entries (id) on delete set null,
  -- vínculo opcional ao Grupo de Teste do Projeto (Fase 33) — quando a
  -- entrada entra em teste de verdade, o app calcula o resultado (média
  -- do grupo, acima/abaixo) a partir daqui, sem precisar duplicar dado.
  campaign_link_id uuid references public.project_campaign_links (id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (catalog_type = 'criativo' and tipo is not null)
    or (catalog_type = 'segmentacao' and tipo is null)
  )
);

create index idx_catalog_entries_client_catalog on public.catalog_entries (client_id, catalog_type);

alter table public.catalog_entries enable row level security;

create policy "admin_gestor_full_catalog_entries" on public.catalog_entries for all
  using (public.current_user_role() in ('admin', 'gestor'))
  with check (public.current_user_role() in ('admin', 'gestor'));
