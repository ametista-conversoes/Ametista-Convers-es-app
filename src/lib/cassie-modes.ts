import { BarChart3, Compass, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'

export type CassieMode = 'assistente' | 'analista' | 'consultora' | 'auditora'

export const CASSIE_MODES: CassieMode[] = ['assistente', 'analista', 'consultora', 'auditora']

export const CASSIE_MODE_INFO: Record<CassieMode, { label: string; description: string; icon: LucideIcon }> = {
  assistente: { label: 'Assistente', description: 'Dúvidas gerais', icon: Sparkles },
  analista: { label: 'Analista', description: 'Métricas (CPA/ROAS/CTR)', icon: BarChart3 },
  consultora: { label: 'Consultora', description: 'Estratégia e funil', icon: Compass },
  auditora: { label: 'Auditora', description: 'Conformidade e riscos', icon: ShieldCheck },
}

// Mesma regra da Edge Function (supabase/functions/cassie/index.ts) —
// duplicada aqui só pra decidir o que mostrar no seletor de modos; quem
// vale de verdade é a checagem do lado do servidor.
const PLAN_MODES: Record<string, CassieMode[]> = {
  validacao: ['assistente'],
  escala: ['assistente', 'analista'],
  dominacao: ['assistente', 'analista', 'consultora', 'auditora'],
}

export function getAllowedCassieModes(role: string, plan: string | null): CassieMode[] {
  if (role === 'admin' || role === 'gestor') return CASSIE_MODES
  return PLAN_MODES[plan ?? ''] ?? ['assistente']
}

// Mesmo texto exato da constante OUT_OF_SCOPE_REPLY na Edge Function —
// usado aqui só pra detectar essa resposta e estilizar a bolha como
// alerta. Se mudar aqui, mudar lá também.
export const OUT_OF_SCOPE_REPLY =
  'Isso foge do que posso te ajudar por aqui — vou encaminhar para o atendimento humano da agência.'
