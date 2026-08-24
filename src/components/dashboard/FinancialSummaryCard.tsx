import { Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface FinancialSummaryCardProps {
  monthlyFee: number | null
  spend: number
  revenue: number
}

export function FinancialSummaryCard({ monthlyFee, spend, revenue }: FinancialSummaryCardProps) {
  const totalCost = spend + (monthlyFee ?? 0)
  const profit = revenue - totalCost

  const rows = [
    { label: 'Investimento em mídia', value: spend },
    { label: 'Mensalidade da agência', value: monthlyFee },
    { label: 'Gasto total', value: totalCost },
    { label: 'Receita gerada', value: revenue },
  ]

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4 text-purple-400" />
          Resumo financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium text-foreground">{formatCurrency(row.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-[#1A2540] pt-3 text-sm">
          <span className="text-muted-foreground">Lucro</span>
          <span className={cn('font-semibold', profit >= 0 ? 'text-emerald-400' : 'text-destructive')}>
            {formatCurrency(profit)}
          </span>
        </div>
        <p className="pt-2 text-xs text-muted-foreground/70">
          Os valores exibidos são estimativas com base nos dados reportados pelas plataformas de anúncio e podem
          apresentar pequenas variações em relação aos valores oficiais de faturamento.
        </p>
      </CardContent>
    </Card>
  )
}
