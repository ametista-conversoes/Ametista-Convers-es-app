import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  icon: LucideIcon
  className?: string
}

export function KpiCard({ label, value, icon: Icon, className }: KpiCardProps) {
  return (
    <Card
      className={cn(
        'rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6',
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
    </Card>
  )
}
