import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-secondary bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-secondary" aria-hidden />
      </div>
    </header>
  )
}
