-- Ametista Conversões — Fase 20 (achado ao vivo, testando com uma
-- conta real de Google Ads pela primeira vez): suporte a contas
-- gerenciadoras (MCC).
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Contexto: a API do Google Ads exige o cabeçalho "login-customer-id"
-- (apontando pra conta gerenciadora) em toda chamada feita em nome de
-- uma conta-cliente que vive por baixo de uma MCC — sem isso, a Google
-- recusa com "403 PERMISSION_DENIED" mesmo com o OAuth certo. Essa
-- coluna guarda qual gerenciadora usar; fica vazia pra conexões que
-- não precisam dela (Meta Ads, Google Forms, ou uma conta de Google
-- Ads sem nenhuma estrutura de MCC por cima).

alter table public.digital_asset_connections add column if not exists login_customer_id text;
