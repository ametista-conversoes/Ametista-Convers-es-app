-- Ametista Conversões — Fase 4.2: dados de exemplo (Relatórios e Meu Projeto)
--
-- Como usar: rode DEPOIS do migration-004-phase4-project.sql. Copie tudo,
-- cole no SQL Editor do Supabase e clique em "Run".

-- Objetivo / ICP / segmento dos 2 projetos de exemplo.
update public.projects set
  objective = 'Aumentar o volume de vendas online no período de verão, mantendo o ROAS acima de 4x.',
  icp = 'Mulheres, 25-45 anos, interessadas em moda praia e acessórios, renda média-alta.',
  segment = 'E-commerce de moda'
where id = '33333333-3333-3333-3333-333333333333'; -- Campanha de Verão (Loja Aurora)

update public.projects set
  objective = 'Reposicionar a marca no mercado e aumentar o reconhecimento antes do lançamento da nova coleção.',
  icp = 'Designers e estúdios criativos em busca de identidade visual autoral, B2B.',
  segment = 'Design e branding'
where id = '44444444-4444-4444-4444-444444444444'; -- Reformulação de Marca (Studio Prisma)

-- Etapas de onboarding para o projeto da Loja Aurora — hoje esse cliente
-- não tinha nenhuma etapa cadastrada (o seed da Fase 3 só criou etapas
-- para o Studio Prisma), então o checklist ficaria vazio no teste.
insert into public.onboarding_steps (title, client_id, project_id, completed, step_order, category) values
  ('Assinatura de contrato', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', true, 1, 'Jurídico'),
  ('Acesso às contas de anúncio', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', true, 2, 'Técnico'),
  ('Aprovação do briefing criativo', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', false, 3, 'Criativo');
