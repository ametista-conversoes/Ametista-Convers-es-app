export interface WorkflowStep {
  title: string
  category: string
}

export interface WorkflowTemplate {
  key: string
  name: string
  description: string
  steps: WorkflowStep[]
}

// Os 4 modelos fixos citados no Prompt da Fase 5.2 — cada um cria uma
// tarefa por etapa (todas em "backlog") no projeto escolhido.
export const workflowTemplates: WorkflowTemplate[] = [
  {
    key: 'novo_cliente',
    name: 'Novo Cliente',
    description: 'Etapas de onboarding para começar a atender um cliente novo.',
    steps: [
      { title: 'Assinatura de contrato', category: 'Jurídico' },
      { title: 'Acesso às contas de anúncio', category: 'Técnico' },
      { title: 'Reunião de kickoff', category: 'Relacionamento' },
      { title: 'Levantamento de briefing', category: 'Planejamento' },
    ],
  },
  {
    key: 'nova_campanha',
    name: 'Nova Campanha',
    description: 'Etapas para planejar e lançar uma campanha de anúncios.',
    steps: [
      { title: 'Definir objetivo e público', category: 'Planejamento' },
      { title: 'Criar estrutura da campanha', category: 'Técnico' },
      { title: 'Configurar rastreamento de conversão', category: 'Técnico' },
      { title: 'Lançar campanha', category: 'Mídia' },
    ],
  },
  {
    key: 'producao_criativos',
    name: 'Produção de Criativos',
    description: 'Etapas do fluxo de criação de peças criativas para o cliente.',
    steps: [
      { title: 'Briefing criativo', category: 'Criativo' },
      { title: 'Criar rascunho/moodboard', category: 'Criativo' },
      { title: 'Produção final', category: 'Criativo' },
      { title: 'Aprovação do cliente', category: 'Revisão' },
    ],
  },
  {
    key: 'configuracao_pixel',
    name: 'Configuração de Pixel',
    description: 'Etapas para instalar e validar o rastreamento de conversões.',
    steps: [
      { title: 'Instalar pixel no site', category: 'Técnico' },
      { title: 'Configurar eventos de conversão', category: 'Técnico' },
      { title: 'Testar disparo de eventos', category: 'Técnico' },
    ],
  },
]
