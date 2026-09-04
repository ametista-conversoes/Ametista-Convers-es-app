import { useState, type ChangeEvent } from 'react'
import { LogOut, Upload, User as UserIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
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
import { uploadUserAvatar } from '@/lib/storage'
import { planLabels, planStyles } from '@/lib/status-styles'
import { PushNotificationsCard } from './PushNotificationsCard'

const userSettingsSchema = z.object({
  fullName: z.string().min(2, 'Digite seu nome completo'),
  phone: z.string().optional(),
})

type UserSettingsValues = z.infer<typeof userSettingsSchema>

export function UserSettingsTab() {
  const { user, role, fullName, phone, avatarUrl, signOut } = useAuth()
  const navigate = useNavigate()
  const updateProfile = useUpdateProfile()
  const { data: client } = useClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const url = await uploadUserAvatar(file, user.id)
      await updateProfile.mutateAsync({ fullName: fullName ?? '', phone, avatarUrl: url })
      toast.success('Foto de perfil atualizada.')
    } catch {
      toast.error('Não foi possível enviar a foto.')
    } finally {
      setUploadingAvatar(false)
    }
  }

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
          <label className="relative mb-4 flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-secondary/50 text-muted-foreground hover:opacity-80">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName ?? 'Foto de perfil'} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-6 w-6" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100">
              <Upload className="h-4 w-4 text-white" />
            </span>
            <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={handleAvatarChange} />
          </label>

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

      <p className="text-center text-xs text-muted-foreground">
        <Link to="/privacy" target="_blank" rel="noreferrer" className="hover:underline">
          Política de Privacidade
        </Link>
        <span className="mx-2">·</span>
        <Link to="/terms" target="_blank" rel="noreferrer" className="hover:underline">
          Termos de Uso
        </Link>
      </p>
    </div>
  )
}
