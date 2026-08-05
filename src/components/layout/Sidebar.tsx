import { NavLink } from 'react-router-dom'
import { Gem } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { clientNavItems, managerNavItems, type NavItem } from '@/lib/nav-items'
import { cn } from '@/lib/utils'

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
    'hover:bg-secondary hover:text-foreground',
    isActive && 'bg-purple-600/15 text-purple-400 border border-purple-600/20',
  )
}

function NavSection({ label, items, onNavigate }: { label: string; items: NavItem[]; onNavigate?: () => void }) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </p>
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === '/' || item.href === '/admin'}
          onClick={onNavigate}
          className={navLinkClassName}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.title}
        </NavLink>
      ))}
    </div>
  )
}

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAuth()
  const showClientSection = role === 'cliente' || role === 'admin'
  const showManagerSection = role === 'gestor' || role === 'admin'

  // "Configurações" fica fora das seções de cada portal e sempre aparece,
  // porque a tela é compartilhada pelos 3 papéis (com abas diferentes).
  const settingsItem = clientNavItems.find((item) => item.href === '/settings')
  const clientItems = clientNavItems.filter((item) => item.href !== '/settings')

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/15 text-purple-400">
          <Gem className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-foreground">Ametista Conversões</span>
      </div>
      <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-3 pb-6">
        <div className="space-y-6">
          {showClientSection && (
            <NavSection label="Portal Cliente" items={clientItems} onNavigate={onNavigate} />
          )}
          {showManagerSection && (
            <NavSection label="Portal Gestor" items={managerNavItems} onNavigate={onNavigate} />
          )}
        </div>
        {settingsItem && (
          <div className="space-y-1 border-t border-secondary pt-3">
            <NavLink to={settingsItem.href} onClick={onNavigate} className={navLinkClassName}>
              <settingsItem.icon className="h-4 w-4 shrink-0" />
              {settingsItem.title}
            </NavLink>
          </div>
        )}
      </nav>
    </div>
  )
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'hidden w-64 shrink-0 border-r border-secondary bg-card md:sticky md:top-0 md:block md:h-dvh',
        className,
      )}
    >
      <SidebarContent />
    </aside>
  )
}
