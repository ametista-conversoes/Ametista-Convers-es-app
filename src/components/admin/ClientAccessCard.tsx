import { useEffect, useState } from 'react'
import { KeyRound, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLinkClientAccount, useLinkedClientAccounts, useResendClientInvite, useUnlinkClientAccount } from '@/hooks/useManagerPortalData'

const RESEND_COOLDOWN_MS = 20_000

interface ClientAccessCardProps {
  clientId: string
}

/** Fase 26 — vincula um login (conta com role='cliente') a esse
 * cliente, ou convida uma conta nova se o e-mail digitado ainda não
 * existir. Antes só dava pra fazer isso com um UPDATE manual em
 * profiles.client_id no SQL Editor do Supabase.
 *
 * Achado ao vivo: clicar em "Vincular ou convidar" de novo pro mesmo
 * e-mail (ex: convite perdido/expirado) não reenviava nada — a conta já
 * existia nesse ponto, então só revinculava em silêncio. Agora toda
 * conta ainda pendente (nunca terminou de escolher a senha, ver
 * `LinkedClientAccount.pending`) ganha um botão "Reenviar convite"
 * próprio, com um intervalo mínimo de 20s entre envios pra não estourar
 * limite de e-mail do Supabase. */
export function ClientAccessCard({ clientId }: ClientAccessCardProps) {
  const { data: accounts, isLoading, isError } = useLinkedClientAccounts(clientId)
  const link = useLinkClientAccount(clientId)
  const resendInvite = useResendClientInvite(clientId)
  const unlink = useUnlinkClientAccount(clientId)
  const [email, setEmail] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState<Record<string, number>>({})
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (!Object.values(cooldownUntil).some((until) => until > Date.now())) return
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [cooldownUntil])

  function secondsLeft(key: string) {
    const remaining = (cooldownUntil[key] ?? 0) - Date.now()
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0
  }

  function startCooldown(key: string) {
    setCooldownUntil((prev) => ({ ...prev, [key]: Date.now() + RESEND_COOLDOWN_MS }))
  }

  async function handleLink() {
    const trimmed = email.trim()
    if (!trimmed) return
    try {
      const result = await link.mutateAsync(trimmed)
      toast.success(result.created ? 'Convite enviado — a pessoa recebe um e-mail pra criar a senha.' : 'Conta vinculada a esse cliente.')
      if (result.created) startCooldown(trimmed)
      setEmail('')
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  async function handleResend(accountId: string) {
    try {
      await resendInvite.mutateAsync(accountId)
      toast.success('Link reenviado — chega com o assunto "Redefinir senha" (não "convite"), mas leva pro mesmo fluxo de criar a senha.')
      startCooldown(accountId)
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
            {accounts.map((account) => {
              const remaining = secondsLeft(account.id)
              return (
                <div key={account.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-foreground">{account.full_name ?? 'Sem nome'}</p>
                      {account.pending && (
                        <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-400">Convite pendente</Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {account.pending && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        disabled={resendInvite.isPending || remaining > 0}
                        onClick={() => handleResend(account.id)}
                      >
                        {remaining > 0 ? `Aguarde ${remaining}s` : 'Reenviar convite'}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                      disabled={unlink.isPending}
                      onClick={() => unlink.mutate(account.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Remover acesso
                    </Button>
                  </div>
                </div>
              )
            })}
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
