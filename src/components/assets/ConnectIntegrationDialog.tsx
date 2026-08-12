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
import { connectIntegration } from '@/lib/integrations'

const PROVIDER_LABELS: Record<'google_ads' | 'google_forms' | 'meta_ads', string> = {
  google_ads: 'Google Ads',
  google_forms: 'Google Forms',
  meta_ads: 'Meta Ads',
}

type IntegrationProvider = keyof typeof PROVIDER_LABELS

interface ConnectIntegrationDialogProps {
  trigger: ReactNode
  asset: ManagerDigitalAssetRecord
}

/** Diálogo pra ligar um Ativo Digital a uma integração real (Google
 * Ads/Forms — Fase 6.2 — e Meta Ads — Fase 6.3). Ao confirmar, o
 * navegador é mandado pra tela de login/consentimento do provedor;
 * quem termina a conexão é a Edge Function "integrations" (rota
 * /callback), não esta tela. */
export function ConnectIntegrationDialog({ trigger, asset }: ConnectIntegrationDialogProps) {
  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState<IntegrationProvider>('google_ads')
  const [formId, setFormId] = useState('')
  const [connecting, setConnecting] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setProvider('google_ads')
      setFormId('')
    }
  }

  async function handleConnect() {
    if (provider === 'google_forms' && !formId.trim()) {
      toast.error('Cole o id ou o link do formulário.')
      return
    }

    setConnecting(true)
    try {
      const authorizationUrl = await connectIntegration({
        provider,
        digitalAssetId: asset.id,
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
            <Select value={provider} onValueChange={(v) => setProvider(v as IntegrationProvider)}>
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
            Você vai ser levado pra tela de login {provider === 'meta_ads' ? 'do Meta' : 'do Google'} pra autorizar o acesso.
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
