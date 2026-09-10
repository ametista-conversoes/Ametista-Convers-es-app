-- Ametista Conversões — Catálogo de Criativos e Segmentações (Fase 34):
-- 2 ajustes pedidos pelo usuário depois de usar a Fase 34 ao vivo.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- =========================================================
-- 1. "tipo" (só em Criativos) ganha 3 subtipos de texto em vez de um
--    "texto" genérico — headline, descrição e frase de destaque são os
--    3 componentes reais de um anúncio de texto (Google/Meta), cada um
--    com regra e tamanho diferentes. "vídeo" continua igual.
-- =========================================================
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.catalog_entries'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%tipo%texto%'
  loop
    execute format('alter table public.catalog_entries drop constraint %I', con.conname);
  end loop;
end $$;

update public.catalog_entries set tipo = 'headline' where tipo = 'texto';

alter table public.catalog_entries
  add constraint catalog_entries_tipo_check
  check (tipo in ('headline', 'descricao', 'frase_destaque', 'video'));

-- =========================================================
-- 2. Avaliação de 1 a 5 estrelas — usada na nova página global
--    "Catálogo" (Portal Gestor) pra marcar os melhores criativos, junto
--    da prioridade. Campo fica genérico na tabela (também aceita nota
--    em Segmentações, mesmo a UI só mostrando estrela pra Criativos por
--    enquanto).
-- =========================================================
alter table public.catalog_entries
  add column rating smallint check (rating between 1 and 5);
