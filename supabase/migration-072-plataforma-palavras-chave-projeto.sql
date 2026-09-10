-- Ametista Conversões — plataforma de anúncios por projeto (Google Ads
-- ou Meta Ads, escolhida na criação e editável depois) + campo de
-- Palavras-chave (documentação manual, igual ao Público-alvo já
-- existente), mostrado na aba Campanha só quando o projeto tem uma
-- campanha de Pesquisa (Search) vinculada e sincronizada.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run". Seguro
-- rodar de novo mesmo se você já rodou antes.

alter table public.projects
  add column if not exists platform text check (platform in ('google_ads', 'meta_ads')),
  add column if not exists keywords text;
