-- Ametista Conversões — Fase 3: dados de exemplo (seed)
--
-- Como usar: rode DEPOIS do migration-002-phase3-entities.sql. Copie tudo,
-- cole no SQL Editor do Supabase e clique em "Run". Rode só UMA VEZ: a
-- organização, os 2 clientes e os 2 projetos têm um "código fixo" e não
-- duplicam se você rodar de novo — mas as tarefas, incidentes, etc. não
-- têm esse código fixo, então rodar o arquivo duas vezes cria linhas
-- repetidas delas. Se quiser recomeçar do zero, apague as linhas de
-- exemplo pelo Table Editor antes de rodar de novo.
--
-- Cria: 1 organização, 2 clientes fictícios (Loja Aurora e Studio Prisma),
-- 2 projetos, algumas tarefas, 1 etapa de onboarding, 1 meta SMART,
-- 1 arquivo, 1 aprovação, 1 incidente, 1 alerta, 2 ativos digitais,
-- 1 reunião e 1 comentário.

insert into public.organizations (id, name, plan, status, domain) values
  ('00000000-0000-0000-0000-000000000001', 'Ametista Conversões', 'agency', 'active', 'ametistaconversoes.com')
on conflict (id) do nothing;

insert into public.clients (id, name, company, email, status, plan, monthly_fee, health_score) values
  ('11111111-1111-1111-1111-111111111111', 'Loja Aurora', 'Aurora Comércio LTDA', 'contato@lojaaurora.com', 'active', 'Pro', 3500, 82),
  ('22222222-2222-2222-2222-222222222222', 'Studio Prisma', 'Prisma Design LTDA', 'contato@studioprisma.com', 'onboarding', 'Básico', 1800, 65)
on conflict (id) do nothing;

insert into public.projects (id, title, client_id, status, health_score, cpa, roas, ctr, spend, revenue, channel, start_date, end_date) values
  ('33333333-3333-3333-3333-333333333333', 'Campanha de Verão', '11111111-1111-1111-1111-111111111111', 'active', 78, 42.50, 4.20, 1.8, 12000, 50400, 'Meta Ads', '2026-06-01', '2026-08-31'),
  ('44444444-4444-4444-4444-444444444444', 'Reformulação de Marca', '22222222-2222-2222-2222-222222222222', 'planning', 60, null, null, null, 0, 0, 'Google Ads', '2026-08-01', null)
on conflict (id) do nothing;

insert into public.tasks (title, client_id, project_id, status, priority, due_date, category) values
  ('Criar criativos do carrossel', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'in_progress', 'high', '2026-08-10', 'Criativo'),
  ('Configurar pixel de conversão', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'done', 'urgent', '2026-06-05', 'Técnico'),
  ('Revisar relatório mensal', '11111111-1111-1111-1111-111111111111', null, 'todo', 'medium', '2026-08-05', 'Relatório'),
  ('Levantamento de briefing', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'backlog', 'medium', '2026-08-08', 'Planejamento');

insert into public.onboarding_steps (title, client_id, project_id, completed, step_order, category) values
  ('Assinatura de contrato', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', true, 1, 'Jurídico'),
  ('Acesso às contas de anúncio', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', false, 2, 'Técnico');

insert into public.smart_goals (title, client_id, metric_type, target_value, current_value, period, status) values
  ('Aumentar ROAS da campanha de verão', '11111111-1111-1111-1111-111111111111', 'roas', 5.0, 4.2, 'quarterly', 'at_risk');

insert into public.file_items (name, client_id, folder, file_url, file_type, status) values
  ('logo-aurora-v2.png', '11111111-1111-1111-1111-111111111111', 'Criativos', 'https://exemplo.com/arquivos/logo-aurora-v2.png', 'image/png', 'approved');

insert into public.approvals (title, client_id, file_url, file_type, status, feedback) values
  ('Carrossel campanha de verão', '11111111-1111-1111-1111-111111111111', 'https://exemplo.com/arquivos/carrossel-verao.pdf', 'application/pdf', 'pending', null);

insert into public.incidents (title, client_id, severity, status, category, resolution) values
  ('Conta de anúncios bloqueada temporariamente', '11111111-1111-1111-1111-111111111111', 'high', 'resolved', 'Ativos Digitais', 'Reativada após verificação de identidade no Meta Business Manager.');

insert into public.alerts (title, message, client_id, severity, category, resolved) values
  ('Orçamento diário quase esgotado', 'A campanha "Campanha de Verão" já usou 90% do orçamento diário.', '11111111-1111-1111-1111-111111111111', 'medium', 'Orçamento', false);

insert into public.digital_assets (name, type, client_id, platform, status) values
  ('Business Manager Aurora', 'business_manager', '11111111-1111-1111-1111-111111111111', 'Meta', 'active'),
  ('Pixel Loja Aurora', 'pixel', '11111111-1111-1111-1111-111111111111', 'Meta', 'active');

insert into public.meetings (title, client_id, date, meeting_link, status) values
  ('Reunião de kickoff', '22222222-2222-2222-2222-222222222222', '2026-08-10 15:00:00-03', 'https://meet.exemplo.com/kickoff-prisma', 'scheduled');

insert into public.comments (content, entity_type, entity_id, client_id, author_role) values
  ('Já enviamos os prints da conta bloqueada para o suporte do Meta.', 'incident', (select id from public.incidents where title = 'Conta de anúncios bloqueada temporariamente' limit 1), '11111111-1111-1111-1111-111111111111', 'gestor');

insert into public.feature_flags (key, label, enabled, scope) values
  ('cassie_ai_beta', 'Assistente Cassie (beta)', false, 'global')
on conflict (key) do nothing;

-- =========================================================
-- Último passo: ligar sua conta de teste "cliente" a um cliente fictício.
-- Troque o e-mail abaixo pelo e-mail real que você usou para a conta
-- de teste com papel "cliente" (criada na Fase 2).
-- =========================================================
update public.profiles
set client_id = '11111111-1111-1111-1111-111111111111' -- Loja Aurora
where email = 'cliente@teste.com';
