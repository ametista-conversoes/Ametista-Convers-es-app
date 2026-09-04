import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/contexts/AuthContext'
import { useUpdateProfile } from '@/hooks/useClientPortalData'
import { AuthLayout } from './AuthLayout'

const resetSchema = z
  .object({
    fullName: z.string().min(2, 'Digite seu nome completo'),
    password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type ResetValues = z.infer<typeof resetSchema>

/** Mesma tela pra "esqueci minha senha" e pra primeiro acesso de quem
 * acabou de aceitar um convite (Fase 26) — o link do Supabase, nos dois
 * casos, já deixa uma sessão temporária ativa antes de chegar aqui.
 * Convite nunca tem full_name (ninguém preencheu ainda), então o campo
 * de nome força o preenchimento nesse caso; recuperação normal já vem
 * com o nome pronto, só confirma. Depois de salvar, desloga de
 * propósito e manda pro /login — pra a pessoa entrar de verdade com a
 * senha que acabou de escolher, em vez de ficar "logada" na sessão
 * temporária do link sem nunca ter passado por um login de verdade. */
export default function ResetPassword() {
  const { user, phone, fullName, updatePassword, signOut } = useAuth()
  const updateProfile = useUpdateProfile()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { fullName: '', password: '', confirmPassword: '' },
  })

  // fullName só fica pronto depois que o AuthContext carrega o perfil
  // (assíncrono, depois da sessão temporária do link ser estabelecida)
  // — preenche o campo assim que chegar, sem mexer no resto do formulário.
  useEffect(() => {
    if (fullName) form.setValue('fullName', fullName)
  }, [fullName])

  async function onSubmit(values: ResetValues) {
    setFormError(null)
    setSubmitting(true)

    const { error } = await updatePassword(values.password)
    if (error) {
      setSubmitting(false)
      setFormError('Não foi possível atualizar a senha. Peça um novo link e tente de novo.')
      return
    }

    try {
      await updateProfile.mutateAsync({ fullName: values.fullName, phone })
    } catch {
      // erro já avisado pelo onError do hook — a senha já foi salva, então segue o fluxo mesmo assim
    }

    setSubmitting(false)
    await signOut()
    toast.success('Conta configurada. Entre com sua nova senha.')
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout title="Configurar sua conta" subtitle="Confirme seus dados e escolha uma senha">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl>
              <Input value={user?.email ?? ''} disabled />
            </FormControl>
          </FormItem>

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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova senha</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar nova senha</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className="text-sm font-medium text-destructive">{formError}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Salvando...' : 'Salvar e continuar'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
