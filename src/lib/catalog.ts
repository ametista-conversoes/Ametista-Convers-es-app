import type { CatalogEntryPrioridade, CatalogEntryStatus, CatalogEntryTipo } from '@/hooks/useManagerPortalData'

// Constantes compartilhadas entre o card por cliente (CatalogCard, na
// Central de Informações) e a página global "Catálogo" (todos os
// clientes) — Fase 34 + ajustes pedidos depois de usar ao vivo.
export const CATALOG_NONE_VALUE = 'none'

export const CATALOG_STATUS_OPTIONS: CatalogEntryStatus[] = ['rascunho', 'em_teste', 'aprovado_implementado', 'descartado']

export const CATALOG_PRIORIDADE_OPTIONS: CatalogEntryPrioridade[] = ['alta', 'media', 'baixa']

/** Subtipos de "texto" em Criativos — os 3 componentes reais de um
 * anúncio de texto (Google/Meta). "video" continua único. */
export const CATALOG_TIPO_OPTIONS: CatalogEntryTipo[] = ['headline', 'descricao', 'frase_destaque', 'video']

export const CATALOG_TIPO_PLACEHOLDERS: Record<CatalogEntryTipo, string> = {
  headline: 'Ex: Transforme seu negócio hoje mesmo',
  descricao: 'Texto mais longo explicando a oferta, o diferencial, a dor que resolve...',
  frase_destaque: 'Ex: Frete grátis · Suporte 24h · Garantia de 30 dias',
  video: 'Caminho/nome do arquivo (ex: ClienteX/Videos/anuncio_v3_final.mp4)',
}

export function truncateCatalogText(text: string, max = 70) {
  return text.length > max ? `${text.slice(0, max)}…` : text
}
