import { createContext, useContext, useState, type ReactNode } from 'react'

interface KpiPopoverContextValue {
  openId: string | null
  setOpenId: (id: string | null) => void
}

const KpiPopoverContext = createContext<KpiPopoverContextValue | null>(null)

/** Garante que só uma dica de KPI fique aberta por vez em toda a tela —
 * cada `KpiCard` guarda seu id aqui em vez de controlar o próprio Popover. */
export function KpiPopoverProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)
  return <KpiPopoverContext.Provider value={{ openId, setOpenId }}>{children}</KpiPopoverContext.Provider>
}

export function useKpiPopover() {
  const context = useContext(KpiPopoverContext)
  if (!context) throw new Error('useKpiPopover deve ser usado dentro de um KpiPopoverProvider')
  return context
}
