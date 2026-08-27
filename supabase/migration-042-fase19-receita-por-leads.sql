-- Ametista Conversões — Fase 19.1b: Receita calculada a partir de Leads,
-- em vez de digitada direto.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".
--
-- Duas premissas de negócio por cliente, editadas na Central de
-- Informações do Cliente: quantos leads em média fecham 1 venda
-- (leads_to_close) e o valor médio de uma venda (average_ticket).
-- O app calcula Vendas = Leads ÷ leads_to_close (Leads = conversões
-- reais sincronizadas de Google Ads + Meta Ads) e Receita = Vendas ×
-- average_ticket — sem essas duas colunas configuradas, Receita/ROAS
-- ficam "—".

alter table public.clients add column if not exists leads_to_close numeric;
alter table public.clients add column if not exists average_ticket numeric;
