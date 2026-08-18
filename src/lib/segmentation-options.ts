// Lista curada de referência (não vem de nenhuma API do Meta/Google —
// só padroniza como o gestor documenta a segmentação de uma campanha).
export interface SegmentationGroup {
  platform: string
  options: string[]
}

export const segmentationOptionGroups: SegmentationGroup[] = [
  {
    platform: 'Meta Ads',
    options: [
      'Interesses',
      'Comportamentos',
      'Dados demográficos',
      'Públicos semelhantes (lookalike)',
      'Públicos personalizados',
      'Localização',
      'Idade e gênero',
      'Conexões',
    ],
  },
  {
    platform: 'Google Ads',
    options: [
      'Públicos de afinidade',
      'Públicos no mercado (in-market)',
      'Segmentos personalizados',
      'Remarketing',
      'Dados demográficos detalhados',
      'Palavras-chave e temas',
      'Públicos semelhantes',
    ],
  },
]
