import { useId } from 'react'
import { HelpCircle, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useKpiPopover } from '@/contexts/KpiPopoverContext'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  description?: string
  className?: string
}

export function KpiCard({ label, value, icon: Icon, description, className }: KpiCardProps) {
  const id = useId()
  const { openId, setOpenId } = useKpiPopover()
  const isOpen = openId === id

  return (
    <Card
      className={cn(
        'relative rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600/15 text-purple-400">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>

      {description && (
        <Popover open={isOpen} onOpenChange={(next) => setOpenId(next ? id : null)}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-3 right-3 text-muted-foreground/50 transition-colors hover:text-purple-400"
              aria-label={`O que é ${label}`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-72 text-sm"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <p className="whitespace-pre-line">{description}</p>
          </PopoverContent>
        </Popover>
      )}
    </Card>
  )
}
