-- Ametista Conversões — criação de Projetos na Central de Informações
-- do Cliente (Portal Gestor).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

alter table public.projects add column if not exists description text;
