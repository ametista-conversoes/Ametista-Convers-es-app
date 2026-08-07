-- Ametista Conversões — dados de exemplo: os 4 modelos de workflow que
-- antes eram fixos no código (src/lib/workflow-templates.ts).
--
-- Como usar: rode DEPOIS do migration-011-phase5-workflow-templates.sql.
-- Copie tudo, cole no SQL Editor do Supabase e clique em "Run".

insert into public.workflow_templates (name, description, steps) values
  (
    'Novo Cliente',
    'Etapas de onboarding para começar a atender um cliente novo.',
    '[
      {"title": "Assinatura de contrato", "category": "Jurídico"},
      {"title": "Acesso às contas de anúncio", "category": "Técnico"},
      {"title": "Reunião de kickoff", "category": "Relacionamento"},
      {"title": "Levantamento de briefing", "category": "Planejamento"}
    ]'::jsonb
  ),
  (
    'Nova Campanha',
    'Etapas para planejar e lançar uma campanha de anúncios.',
    '[
      {"title": "Definir objetivo e público", "category": "Planejamento"},
      {"title": "Criar estrutura da campanha", "category": "Técnico"},
      {"title": "Configurar rastreamento de conversão", "category": "Técnico"},
      {"title": "Lançar campanha", "category": "Mídia"}
    ]'::jsonb
  ),
  (
    'Produção de Criativos',
    'Etapas do fluxo de criação de peças criativas para o cliente.',
    '[
      {"title": "Briefing criativo", "category": "Criativo"},
      {"title": "Criar rascunho/moodboard", "category": "Criativo"},
      {"title": "Produção final", "category": "Criativo"},
      {"title": "Aprovação do cliente", "category": "Revisão"}
    ]'::jsonb
  ),
  (
    'Configuração de Pixel',
    'Etapas para instalar e validar o rastreamento de conversões.',
    '[
      {"title": "Instalar pixel no site", "category": "Técnico"},
      {"title": "Configurar eventos de conversão", "category": "Técnico"},
      {"title": "Testar disparo de eventos", "category": "Técnico"}
    ]'::jsonb
  );
