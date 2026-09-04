import { useState } from 'react'
import { KeyRound, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLinkClientAccount, useLinkedClientAccounts, useUnlinkClientAccount } from '@/hooks/useManagerPortalData'

interface ClientAccessCardProps {
  clientId: string
}

/** Fase 26 — vincula um login (conta com role='cliente') a esse
 * cliente, ou convida uma conta nova se o e-mail digitado ainda não
 * existir. Antes só dava pra fazer isso com um UPDATE manual em
 * profiles.client_id no SQL Editor do Supabase. */
export function ClientAccessCard({ clientId }: ClientAccessCardProps) {
  const { data: accounts, isLoading, isError } = useLinkedClientAccounts(clientId)
  const link = useLinkClientAccount(clientId)
  const unlink = useUnlinkClientAccount(clientId)
  const [email, setEmail] = useState('')

  async function handleLink() {
    const trimmed = email.trim()
    if (!trimmed) return
    try {
      const result = await link.mutateAsync(trimmed)
      toast.success(result.created ? 'Convite enviado — a pessoa recebe um e-mail pra criar a senha.' : 'Conta vinculada a esse cliente.')
      setEmail('')
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-purple-400" />
          Acesso ao Portal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        <p className="text-xs text-muted-foreground">
          Contas de login com acesso ao portal desse cliente. Digite um e-mail: se já existir uma conta, ela é vinculada; se
          não existir, mandamos um convite pra criar a senha.
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : isError ? (
          <p className="text-sm text-destructive">Erro ao carregar as contas vinculadas. Tente novamente.</p>
        ) : accounts && accounts.length > 0 ? (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-foreground">{account.full_name ?? 'Sem nome'}</p>
                  <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 text-xs text-muted-foreground hover:text-destructive"
                  disabled={unlink.isPending}
                  onClick={() => unlink.mutate(account.id)}
                >
                  <X className="h-3.5 w-3.5" />
                  Remover acesso
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma conta com acesso ainda.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="email"
            placeholder="email@cliente.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 flex-1"
          />
          <Button type="button" size="sm" disabled={!email.trim() || link.isPending} onClick={handleLink}>
            {link.isPending ? 'Enviando...' : 'Vincular ou convidar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
