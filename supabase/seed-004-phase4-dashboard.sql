-- Ametista Conversões — Fase 4.1: dados de exemplo do Dashboard/Performance
--
-- Como usar: rode DEPOIS do migration-003-phase4-dashboard.sql. Copie tudo,
-- cole no SQL Editor do Supabase e clique em "Run".

-- Sub-notas do Health Score dos 2 clientes de exemplo.
update public.clients set
  health_performance = 85,
  health_financial = 78,
  health_delivery = 90,
  health_relationship = 74
where id = '11111111-1111-1111-1111-111111111111'; -- Loja Aurora

update public.clients set
  health_performance = 60,
  health_financial = 65,
  health_delivery = 70,
  health_relationship = 68
where id = '22222222-2222-2222-2222-222222222222'; -- Studio Prisma

-- 21 dias de retratos diários para o projeto ativo da Loja Aurora, com
-- tendência de crescimento (para o gráfico de linha ficar interessante).
with days as (
  select d::date as snapshot_date, row_number() over (order by d) as n
  from generate_series(current_date - interval '20 days', current_date, interval '1 day') as d
),
calc as (
  select
    snapshot_date,
    round((380 + n * 8 + (random() * 60 - 30))::numeric, 2) as spend,
    round((1500 + n * 55 + (random() * 200 - 100))::numeric, 2) as revenue,
    round((1.5 + random() * 0.6)::numeric, 2) as ctr
  from days
)
insert into public.performance_snapshots (client_id, project_id, snapshot_date, spend, revenue, roas, ctr)
select
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  snapshot_date,
  spend,
  revenue,
  round((revenue / nullif(spend, 0))::numeric, 2),
  ctr
from calc
on conflict (project_id, snapshot_date) do nothing;
