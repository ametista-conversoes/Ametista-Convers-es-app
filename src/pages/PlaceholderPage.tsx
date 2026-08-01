import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PlaceholderPageProps {
  title: string
  portal: 'Portal Cliente' | 'Portal Gestor'
}

export function PlaceholderPage({ title, portal }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{portal}</p>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="content-grid gap-4">
        <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              Exemplo de card
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10">
                Ativo
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0 pt-4">
            <p className="text-sm text-muted-foreground">
              Esta é a página de {title.toLowerCase()}. O conteúdo real chega nas próximas fases.
            </p>
            <div className="flex items-center gap-2">
              <Button>Ação principal</Button>
              <Button variant="secondary">
                <Bell className="h-4 w-4" />
                Notificar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
          <CardHeader className="p-0">
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 p-0 pt-4">
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10">
              Ativo
            </Badge>
            <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/10">
              Pendente
            </Badge>
            <Badge className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/10">
              Crítico
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
