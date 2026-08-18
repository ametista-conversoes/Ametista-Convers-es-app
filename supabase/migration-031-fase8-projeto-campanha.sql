-- Fase 8.1 — Detalhamento de Projeto/Campanha
-- Novos campos de "Campanha" na aba de detalhe de um projeto (Central
-- de Informações do Cliente). Público-alvo, objetivo e "outras
-- informações" reaproveitam icp/objective/description, que já
-- existem.

alter table public.projects
  add column if not exists segmentations text[] not null default '{}',
  add column if not exists systems text;
