// Textos exibidos no tooltip de "?" dos KpiCard (src/components/dashboard/KpiCard.tsx).
// Formato: nome/sigla, o que o indicador mostra, e a fórmula usada no app.

export const kpiDescriptions = {
  // ---------- Portal Cliente (Dashboard, Performance, Relatórios) ----------
  investimento:
    'Investimento = Valor total aplicado em mídia paga\n\n' +
    'Quanto foi gasto em anúncios nas plataformas conectadas no período.\n\n' +
    'Cálculo: soma do investimento de todos os projetos.',

  receita:
    'Receita = Faturamento gerado pelas campanhas\n\n' +
    'Valor total de vendas/conversões atribuídas às campanhas de marketing no período.\n\n' +
    'Cálculo: soma da receita de todos os projetos.',

  roas:
    'ROAS = Retorno sobre Investimento em Anúncios (Return on Ad Spend)\n\n' +
    'Mostra quanto foi gerado em receita para cada real investido em anúncios. Um ROAS de 4x significa que cada R$ 1 investido gerou R$ 4 em receita.\n\n' +
    'Cálculo: receita total ÷ investimento total.',

  cpa:
    'CPA = Custo por Aquisição\n\n' +
    'Quanto custa, em média, conseguir uma conversão (venda, lead, etc.). Quanto menor, mais eficiente a campanha.\n\n' +
    'Cálculo: investimento total ÷ número de conversões.',

  conversoes:
    'Conversões = Número de resultados gerados\n\n' +
    'Quantidade de ações desejadas (vendas, leads, cadastros) atribuídas às campanhas.\n\n' +
    'Cálculo: investimento ÷ CPA de cada projeto, somado.',

  ctrMedio:
    'CTR = Taxa de Cliques (Click-Through Rate)\n\n' +
    'Percentual de pessoas que clicaram no anúncio em relação a quantas o visualizaram — indica o quão atrativo é o criativo.\n\n' +
    'Cálculo: média do CTR de todos os projetos.',

  healthScoreMedio:
    'Health Score = Nota de saúde do projeto\n\n' +
    'Pontuação de 0 a 100 que resume o desempenho geral do projeto (performance, financeiro, entrega e relacionamento).\n\n' +
    'Cálculo: média do Health Score de todos os projetos.',

  // ---------- Portal Gestor (Dashboard Executivo) ----------
  mrrTotal:
    'MRR = Receita Recorrente Mensal (Monthly Recurring Revenue)\n\n' +
    'Quanto a agência fatura por mês com mensalidades de clientes ativos — a base de receita previsível do negócio.\n\n' +
    'Cálculo: soma da mensalidade dos clientes com status Ativo.',

  clientesAtivos:
    'Clientes Ativos = Clientes com contrato em vigor\n\n' +
    'Quantos clientes a agência está atendendo atualmente (não conta pausados, em onboarding ou encerrados).\n\n' +
    'Cálculo: contagem de clientes com status Ativo.',

  churnRate:
    'Churn Rate = Taxa de cancelamento\n\n' +
    'Percentual de clientes que encerraram o contrato em relação ao total já atendido. Quanto menor, melhor a retenção.\n\n' +
    'Cálculo: clientes com status Encerrado ÷ total de clientes.',

  incidentesAbertos:
    'Incidentes Abertos = Problemas ainda não resolvidos\n\n' +
    'Quantidade de incidentes registrados que ainda precisam de atenção da equipe.\n\n' +
    'Cálculo: contagem de incidentes com status Aberto ou Em andamento.',

  clientesEmRisco:
    'Clientes em Risco = Clientes com sinais de insatisfação\n\n' +
    'Clientes cuja saúde geral está baixa e que podem cancelar o contrato se não forem priorizados.\n\n' +
    'Cálculo: contagem de clientes com Health Score abaixo de 50.',

  cargaDeTrabalho:
    'Carga de Trabalho = Volume de tarefas em aberto\n\n' +
    'Quantidade total de tarefas que a equipe ainda precisa concluir, somando todos os clientes.\n\n' +
    'Cálculo: contagem de tarefas com status diferente de Concluída.',

  produtividade:
    'Produtividade = Eficiência da equipe na entrega de tarefas\n\n' +
    'Mostra a proporção de tarefas já finalizadas em relação ao total.\n\n' +
    'Cálculo: tarefas concluídas ÷ total de tarefas.',

  budgetGerenciado:
    'Budget Gerenciado = Verba de mídia sob gestão da agência\n\n' +
    'Valor total investido em anúncios que a agência está atualmente gerenciando para os clientes.\n\n' +
    'Cálculo: soma do investimento dos projetos ativos.',
} as const
