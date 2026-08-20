// Paleta categórica dos gráficos (validada com o script de acessibilidade
// do skill de dataviz contra o fundo escuro do app, #0B1220 — passa em
// todos os checks: banda de luminosidade, separação para daltonismo e
// contraste). A cor sempre representa a mesma métrica em todos os
// gráficos (investimento nunca muda de cor entre o de barras e o de linha).
export const CHART_COLORS = {
  investimento: '#7C3AED', // roxo primário da marca
  receita: '#199E70', // verde-azulado, lê como "positivo/crescimento"
  respostas: '#7C3AED', // roxo primário — % de respondentes por opção (Públicos-Alvo, Fase 8.3)
} as const

export const CHART_GRID_COLOR = '#1A2540'
export const CHART_AXIS_COLOR = '#8B93A7' // aprox. muted-foreground
export const CHART_SURFACE_COLOR = '#131C31' // aprox. card
