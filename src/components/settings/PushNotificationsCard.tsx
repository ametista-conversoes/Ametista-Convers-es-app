import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import {
  getCurrentPushSubscription,
  isLikelyIosOutsideStandalone,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-notifications'

export function PushNotificationsCard() {
  const { user } = useAuth()
  const [supported] = useState(isPushSupported)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!supported) {
      setChecking(false)
      return
    }
    getCurrentPushSubscription()
      .then((sub) => setSubscribed(!!sub))
      .finally(() => setChecking(false))
  }, [supported])

  async function handleActivate() {
    if (!user?.id) return
    setLoading(true)
    try {
      await subscribeToPush(user.id)
      setSubscribed(true)
      toast.success('Notificações ativadas neste aparelho.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível ativar as notificações.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate() {
    setLoading(true)
    try {
      await unsubscribeFromPush()
      setSubscribed(false)
      toast.success('Notificações desativadas neste aparelho.')
    } catch {
      toast.error('Não foi possível desativar as notificações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-purple-400" />
          Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        {!supported ? (
          <p className="text-sm text-muted-foreground">
            Este navegador não suporta notificações.
            {isLikelyIosOutsideStandalone() &&
              ' No iPhone/iPad, primeiro adicione o app à Tela de Início (compartilhar → "Adicionar à Tela de Início") — o Safari normal não entrega notificação.'}
          </p>
        ) : checking ? (
          <p className="text-sm text-muted-foreground">Verificando...</p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {subscribed ? 'Ativadas neste aparelho' : 'Receba avisos de incidentes, alertas, reuniões e metas'}
              </p>
              <p className="text-xs text-muted-foreground">
                Ativação separada por navegador/aparelho — repita em cada um que quiser usar.
              </p>
            </div>
            {subscribed ? (
              <Button variant="outline" disabled={loading} onClick={handleDeactivate}>
                <BellOff className="h-4 w-4" />
                Desativar
              </Button>
            ) : (
              <Button disabled={loading} onClick={handleActivate}>
                <Bell className="h-4 w-4" />
                {loading ? 'Ativando...' : 'Ativar notificações'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
