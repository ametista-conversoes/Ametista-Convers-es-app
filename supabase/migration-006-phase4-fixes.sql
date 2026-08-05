-- Ametista Conversões — Ajustes na Fase 4.3 (Portal do Cliente)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Rode DEPOIS
-- do migration-005-phase4-collab.sql.

-- Descrição opcional da tarefa, mostrada no popup de detalhes.
alter table public.tasks add column description text;

-- Título do comentário, mostrado em destaque antes do texto no mural.
alter table public.comments add column title text;
