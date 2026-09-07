-- Ametista Conversões — Tipo de campanha por projeto (Vendas/Leads).
--
-- "Vendas": e-commerce/negócios de produto barato e rápido — cada
-- conversão já é uma venda, sem processo de convencimento. "Leads":
-- serviços/produtos caros com processo de fechamento (ex: casas,
-- carros) — cada conversão é um lead que ainda precisa virar venda.
-- Isso muda a fórmula de Receita automática por projeto vinculado a
-- uma campanha real (ver ProjectDetailDialog.tsx):
--   Vendas: Receita = Conversões × Ticket Médio do cliente
--   Leads:  Receita = (Conversões ÷ leads_to_close do cliente) × Ticket Médio
--
-- Default 'leads' preserva o comportamento visual de hoje — nenhum
-- projeto existente muda de aparência até o gestor mudar o tipo dele.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

alter table public.projects
  add column if not exists conversion_type text not null default 'leads'
  check (conversion_type in ('vendas', 'leads'));
