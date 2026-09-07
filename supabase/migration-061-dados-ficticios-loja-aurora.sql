-- Ametista Conversões — dados fictícios pra Loja Aurora (cliente de
-- teste), pra deixar o app com uma cara de "cheio" pra demonstração:
-- 4 campanhas/projetos (Search, Vídeo, Performance Max, Display) com
-- métricas realistas + 45 dias de histórico diário em
-- performance_snapshots, alimentando os mesmos gráficos/KPIs que uma
-- sincronização real preencheria. NÃO é dado real de anúncio nenhum —
-- só serve pra ver o app populado (ex: gravar vídeo de demonstração)
-- enquanto o Google Ads API Basic Access não sai.
--
-- Idempotente: pode rodar de novo (ex: pra gerar um histórico "mais
-- recente") que primeiro apaga o que esse mesmo script criou antes.
--
-- Como usar: copie todo este arquivo e cole no SQL Editor do painel do
-- Supabase (SQL Editor > New query), depois clique em "Run".

-- =========================================================
-- 0. Premissas de negócio da Loja Aurora (Receita = Conversões ÷
--    leads_to_close × average_ticket) — só preenche se ainda estiver
--    vazio, pra não sobrescrever um valor real que você já tenha
--    configurado na Central de Informações.
-- =========================================================
update public.clients
set leads_to_close = coalesce(leads_to_close, 1.2),
    average_ticket = coalesce(average_ticket, 380)
where name = 'Loja Aurora';

-- =========================================================
-- 1. Limpa uma rodada anterior deste script (projetos e snapshots
--    marcados "(demo)"), pra poder rodar de novo sem duplicar.
-- =========================================================
delete from public.performance_snapshots
where project_id in (
  select id from public.projects
  where client_id = (select id from public.clients where name = 'Loja Aurora' limit 1)
    and title like '% (demo)'
);

delete from public.projects
where client_id = (select id from public.clients where name = 'Loja Aurora' limit 1)
  and title like '% (demo)';

-- =========================================================
-- 2. As 4 campanhas/projetos — números escolhidos pra parecer real:
--    Search e Performance Max com ROAS forte (intenção de compra
--    direta), Vídeo e Display mais fracos (topo de funil/remarketing),
--    igual costuma acontecer de verdade num e-commerce.
-- =========================================================
insert into public.projects
  (title, client_id, status, health_score, cpa, roas, ctr, spend, revenue, channel, start_date, end_date, objective)
values
  ('Campanha Search — Loja Aurora (demo)',
   (select id from public.clients where name = 'Loja Aurora' limit 1),
   'active', 88, 85.00, 4.00, 6.8, 8500.00, 34000.00, 'Search',
   current_date - 45, null, 'Captar quem já está buscando os produtos da loja'),

  ('Campanha Vídeo — Loja Aurora (demo)',
   (select id from public.clients where name = 'Loja Aurora' limit 1),
   'active', 68, 140.00, 2.33, 0.9, 4200.00, 9800.00, 'Vídeo',
   current_date - 45, null, 'Aumentar reconhecimento de marca no YouTube'),

  ('Campanha Performance Max — Loja Aurora (demo)',
   (select id from public.clients where name = 'Loja Aurora' limit 1),
   'active', 91, 68.00, 4.33, 3.2, 12000.00, 52000.00, 'Performance Max',
   current_date - 45, null, 'Maximizar conversão em todos os canais do Google via IA'),

  ('Campanha Display — Loja Aurora (demo)',
   (select id from public.clients where name = 'Loja Aurora' limit 1),
   'active', 61, 155.00, 2.00, 0.6, 3100.00, 6200.00, 'Display',
   current_date - 45, null, 'Remarketing pra quem visitou o site e não comprou');

-- =========================================================
-- 3. Histórico diário (45 dias) por campanha — alimenta os gráficos de
--    tendência e os cards de KPI. CPC/taxa de conversão por canal
--    escolhidos pra bater com o total da campanha (spend/cpa/ctr lá de
--    cima); random() dá uma variação orgânica dia a dia, não uma linha
--    reta.
-- =========================================================
insert into public.performance_snapshots
  (client_id, project_id, snapshot_date, spend, revenue, roas, ctr, channel, clicks, impressions, conversions)
select
  p.client_id,
  p.id,
  d.snapshot_date,
  d.day_spend,
  d.day_conversions * (cl.average_ticket / cl.leads_to_close),
  case when d.day_spend > 0
    then round((d.day_conversions * (cl.average_ticket / cl.leads_to_close) / d.day_spend)::numeric, 2)
    else null
  end,
  p.ctr,
  p.channel,
  d.day_clicks,
  d.day_impressions,
  d.day_conversions
from public.projects p
join public.clients cl on cl.id = p.client_id
cross join lateral (
  select
    gs.day::date as snapshot_date,
    round(((p.spend / 45) * (0.7 + random() * 0.6))::numeric, 2) as day_spend
  from generate_series(current_date - 44, current_date, interval '1 day') as gs(day)
) base
cross join lateral (
  select
    case p.channel
      when 'Search' then 2.20
      when 'Vídeo' then 0.35
      when 'Performance Max' then 1.10
      when 'Display' then 0.45
    end as cpc,
    case p.channel
      when 'Search' then 0.026
      when 'Vídeo' then 0.0025
      when 'Performance Max' then 0.016
      when 'Display' then 0.0029
    end as conv_rate
) rates
cross join lateral (
  select
    base.snapshot_date,
    base.day_spend,
    greatest(1, round(base.day_spend / rates.cpc)) as day_clicks
) clk
cross join lateral (
  select
    clk.snapshot_date,
    clk.day_spend,
    clk.day_clicks,
    greatest(clk.day_clicks, round(clk.day_clicks / (p.ctr / 100))) as day_impressions,
    greatest(0, round(clk.day_clicks * rates.conv_rate * (0.5 + random())::numeric)) as day_conversions
) d
where p.client_id = (select id from public.clients where name = 'Loja Aurora' limit 1)
  and p.title like '% (demo)';

-- =========================================================
-- 4. Recalcula o Health Score da Loja Aurora agora, pra já refletir o
--    histórico novo (senão só atualiza no cron das 6h).
-- =========================================================
select public.recompute_client_health_score(
  (select id from public.clients where name = 'Loja Aurora' limit 1)
);
