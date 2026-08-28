import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ListChecks } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type GoogleAdsAccount, listGoogleAdsAccounts, selectGoogleAdsAccount } from '@/lib/integrations'

interface SelectGoogleAdsAccountDialogProps {
  connectionId: string
}

/** Diálogo pra escolher, numa lista, qual conta de anúncios real do
 * Google Ads usar numa conexão (Fase 20) — aparece só quando a conexão
 * já está "connected" mas `handleCallback` não conseguiu decidir
 * sozinho (0 ou mais de 1 conta encontrada, ex: conta gerenciadora com
 * várias contas-cliente por baixo). A lista nunca inclui conta
 * gerenciadora/MCC — só contas de anúncio de verdade. */
export function SelectGoogleAdsAccountDialog({ connectionId }: SelectGoogleAdsAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  const accountsQuery = useQuery({
    queryKey: ['google-ads-accounts', connectionId],
    queryFn: () => listGoogleAdsAccounts(connectionId),
    enabled: open,
  })

  async function handleConfirm(account: GoogleAdsAccount) {
    setSaving(true)
    try {
      await selectGoogleAdsAccount(connectionId, account)
      queryClient.invalidateQueries({ queryKey: ['digital-asset-connections'] })
      toast.success('Conta de anúncios escolhida.')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar a conta escolhida.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground hover:text-foreground">
          <ListChecks className="h-3 w-3" />
          Escolher conta de anúncios
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escolher conta de anúncios</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Essa conta do Google tem mais de uma conta de anúncios acessível (ou nenhuma foi encontrada) — escolha qual usar
            pra sincronizar. Contas gerenciadoras (MCC) não aparecem aqui, só contas de anúncio de verdade.
          </p>
          {accountsQuery.isLoading && <p className="text-xs text-muted-foreground">Buscando contas...</p>}
          {accountsQuery.isError && (
            <p className="text-xs text-destructive">
              {accountsQuery.error instanceof Error ? accountsQuery.error.message : 'Não foi possível buscar as contas.'}
            </p>
          )}
          {accountsQuery.data && (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha a conta" />
              </SelectTrigger>
              <SelectContent>
                {accountsQuery.data.length === 0 && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">Nenhuma conta de anúncios encontrada.</p>
                )}
                {accountsQuery.data.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name ?? account.id} ({account.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            disabled={!selectedId || saving}
            onClick={() => {
              const account = accountsQuery.data?.find((a) => a.id === selectedId)
              if (account) handleConfirm(account)
            }}
          >
            {saving ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
