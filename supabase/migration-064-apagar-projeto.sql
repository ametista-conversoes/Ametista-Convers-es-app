-- Ametista Conversões — permite apagar um projeto sem quebrar por causa
-- da conexão de integração vinculada a ele.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Seguro
-- rodar de novo mesmo se você já rodou uma versão anterior.

-- =========================================================
-- digital_asset_connections.project_id (migration-017) foi criado sem
-- "on delete", então apagar um projeto que uma conexão aponta pra ele
-- (destino da sincronização de performance_snapshots) falhava com erro
-- de foreign key. Mesmo padrão que já existe pras outras referências a
-- projects (on delete set null) — apagar o projeto só desvincula a
-- conexão, não apaga a conexão em si.
-- =========================================================
alter table public.digital_asset_connections
  drop constraint if exists digital_asset_connections_project_id_fkey;
alter table public.digital_asset_connections
  add constraint digital_asset_connections_project_id_fkey
  foreign key (project_id) references public.projects (id) on delete set null;
