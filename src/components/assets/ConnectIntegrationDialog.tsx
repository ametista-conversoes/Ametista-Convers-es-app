import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ManagerDigitalAssetRecord } from '@/hooks/useManagerPortalData'
import { useAllProjects } from '@/hooks/useManagerPortalData'
import { connectIntegration } from '@/lib/integrations'

const PROVIDER_LABELS: Record<'google_ads' | 'google_forms', string> = {
  google_ads: 'Google Ads',
  google_forms: 'Google Forms',
}

interface ConnectIntegrationDialogProps {
  trigger: ReactNode
  asset: ManagerDigitalAssetRecord
}

/** Diálogo pra ligar um Ativo Digital a uma integração real (Fase 6.2
 * — só Google por enquanto, Meta Ads chega na 6.3). Ao confirmar, o
 * navegador é mandado pra tela de login/consentimento do Google;
 * quem termina a conexão é a Edge Function "integrations" (rota
 * /callback), não esta tela. */
export function ConnectIntegrationDialog({ trigger, asset }: ConnectIntegrationDialogProps) {
  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState<'google_ads' | 'google_forms'>('google_ads')
  const [projectId, setProjectId] = useState('')
  const [formId, setFormId] = useState('')
  const [connecting, setConnecting] = useState(false)

  const { data: projects } = useAllProjects()
  const clientProjects = (projects ?? []).filter((p) => p.client_id === asset.client_id)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setProvider('google_ads')
      setProjectId('')
      setFormId('')
    }
  }

  async function handleConnect() {
    if (provider === 'google_ads' && !projectId) {
      toast.error('Escolha o projeto que vai receber as métricas.')
      return
    }
    if (provider === 'google_forms' && !formId.trim()) {
      toast.error('Cole o id ou o link do formulário.')
      return
    }

    setConnecting(true)
    try {
      const authorizationUrl = await connectIntegration({
        provider,
        digitalAssetId: asset.id,
        projectId: provider === 'google_ads' ? projectId : undefined,
        formId: provider === 'google_forms' ? formId.trim() : undefined,
      })
      window.location.href = authorizationUrl
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível iniciar a conexão.')
      setConnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar integração</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Provedor</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as 'google_ads' | 'google_forms')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {provider === 'google_ads' && (
            <div className="space-y-2">
              <Label>Projeto que vai receber as métricas</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {clientProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clientProjects.length === 0 && (
                <p className="text-xs text-muted-foreground">Esse cliente ainda não tem nenhum projeto cadastrado.</p>
              )}
            </div>
          )}

          {provider === 'google_forms' && (
            <div className="space-y-2">
              <Label>Id ou link do formulário</Label>
              <Input
                placeholder="https://docs.google.com/forms/d/..."
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Você vai ser levado pra tela de login do Google pra autorizar o acesso.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Redirecionando...' : 'Conectar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
