import { useState } from 'react'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useClient, useUpdateProfile } from '@/hooks/useClientPortalData'
import { planLabels, planStyles } from '@/lib/status-styles'
import { PushNotificationsCard } from './PushNotificationsCard'

const userSettingsSchema = z.object({
  fullName: z.string().min(2, 'Digite seu nome completo'),
  phone: z.string().optional(),
})

type UserSettingsValues = z.infer<typeof userSettingsSchema>

export function UserSettingsTab() {
  const { user, role, fullName, phone, signOut } = useAuth()
  const navigate = useNavigate()
  const updateProfile = useUpdateProfile()
  const { data: client } = useClient()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<UserSettingsValues>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: { fullName: fullName ?? '', phone: phone ?? '' },
  })

  async function onSubmit(values: UserSettingsValues) {
    try {
      await updateProfile.mutateAsync({
        fullName: values.fullName,
        phone: values.phone?.trim() ? values.phone.trim() : null,
      })
      toast.success('Dados atualizados.')
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4 text-purple-400" />
            Meus dados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="text-sm">
                <span className="text-muted-foreground">E-mail: </span>
                <span className="font-medium text-foreground">{user?.email}</span>
              </div>

              {role === 'cliente' && client?.plan && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Plano: </span>
                  <Badge className={planStyles[client.plan] ?? ''}>{planLabels[client.plan] ?? client.plan}</Badge>
                </div>
              )}

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <Input type="tel" autoComplete="tel" placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <PushNotificationsCard />

      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardContent className="flex items-center justify-between gap-3 p-0">
          <div>
            <p className="text-sm font-medium text-foreground">Sair da conta</p>
            <p className="text-xs text-muted-foreground">Encerra a sessão neste dispositivo.</p>
          </div>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sair da sua conta?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Você vai precisar entrar de novo pra acessar o app neste dispositivo.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleSignOut}>
                  Sair
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
