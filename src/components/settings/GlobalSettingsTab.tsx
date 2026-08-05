import { Flag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFeatureFlags } from '@/hooks/useClientPortalData'

export function GlobalSettingsTab() {
  const { data: flags, isLoading } = useFeatureFlags()

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flag className="h-4 w-4 text-purple-400" />
          Sinalizadores de funcionalidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && (flags ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum sinalizador cadastrado.</p>
        )}
        {(flags ?? []).map((flag) => (
          <div key={flag.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{flag.label ?? flag.key}</p>
              <p className="text-xs text-muted-foreground">
                {flag.key} · escopo: {flag.scope}
              </p>
            </div>
            <Badge
              className={
                flag.enabled
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
              }
            >
              {flag.enabled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        ))}
        <p className="pt-2 text-xs text-muted-foreground/70">
          A edição destes sinalizadores chega no Portal do Gestor (Fase 5). Por enquanto esta aba é só leitura.
        </p>
      </CardContent>
    </Card>
  )
}
