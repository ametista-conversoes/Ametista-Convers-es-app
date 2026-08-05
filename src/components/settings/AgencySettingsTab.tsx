import { Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrganization } from '@/hooks/useClientPortalData'

export function AgencySettingsTab() {
  const { data: organization, isLoading } = useOrganization()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (!organization) {
    return (
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardContent className="p-0 text-sm text-muted-foreground">Nenhuma agência cadastrada ainda.</CardContent>
      </Card>
    )
  }

  const rows = [
    { label: 'Nome', value: organization.name },
    { label: 'Plano', value: organization.plan ?? '—' },
    { label: 'Status', value: organization.status ?? '—' },
    { label: 'Domínio', value: organization.domain ?? '—' },
  ]

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-purple-400" />
          Dados da agência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium text-foreground">{row.value}</span>
          </div>
        ))}
        <p className="pt-2 text-xs text-muted-foreground/70">
          A edição desses dados chega no Portal do Gestor (Fase 5). Por enquanto esta aba é só leitura.
        </p>
      </CardContent>
    </Card>
  )
}
