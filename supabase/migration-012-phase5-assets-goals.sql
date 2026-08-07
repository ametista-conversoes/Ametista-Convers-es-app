-- Ametista Conversões — Ativos Digitais (link/código) e Metas SMART (prazo)
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- Ativos com link de acesso (conta de anúncios, Business Manager, domínio)
-- guardam em "url"; ativos que são código (pixel, tag) guardam em "code".
-- Cada ativo usa só uma das duas colunas, dependendo do tipo escolhido.
alter table public.digital_assets add column url text;
alter table public.digital_assets add column code text;

-- Prazo único da meta (calendário). O campo "period" (texto livre) continua
-- existindo no banco por compatibilidade, mas deixa de ser usado pela tela.
alter table public.smart_goals add column target_date date;
