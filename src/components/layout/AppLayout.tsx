import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { Sidebar, SidebarContent } from './Sidebar'
import { TopBar } from './TopBar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <div
      className="flex h-dvh bg-background"
      style={{
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <Sidebar />

      {/* Menu retrátil (drawer) para telas pequenas */}
      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden',
          isMobileNavOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/60 transition-opacity',
            isMobileNavOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setIsMobileNavOpen(false)}
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-64 border-r border-secondary bg-card transition-transform duration-200',
            isMobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="absolute right-3 top-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SidebarContent onNavigate={() => setIsMobileNavOpen(false)} />
        </div>
      </div>

      <div className="flex h-dvh flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setIsMobileNavOpen(true)} />
        {/* Só o <main> rola (não o documento) — Sidebar/TopBar ficam de
            fora do fluxo de scroll em vez de usar `position: sticky`.
            Isso evita um bug em que abrir qualquer Select/Dialog/Dropdown
            do Radix (que trava o scroll do body enquanto está aberto)
            fazia a sidebar e a topbar sumirem em páginas altas e
            roladas — confirmado ao vivo, `position: sticky` relativo ao
            scroll do documento quebra quando o body tem seu overflow
            mexido, seja pelo nosso CSS ou por uma lib de terceiros. */}
        <main
          className="content-grid-container flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
