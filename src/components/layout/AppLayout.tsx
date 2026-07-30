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
    <div className="flex min-h-screen bg-background">
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

      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar onMenuClick={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
