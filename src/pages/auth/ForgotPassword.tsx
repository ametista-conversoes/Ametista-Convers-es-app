import { useState } from 'react'
import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from './AuthLayout'

const forgotSchema = z.object({
  email: z.string().min(1, 'Digite seu e-mail').email('E-mail inválido'),
})

type ForgotValues = z.infer<typeof forgotSchema>

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotValues) {
    setFormError(null)
    setSubmitting(true)
    const { error } = await sendPasswordReset(values.email)
    setSubmitting(false)

    if (error) {
      setFormError(error)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout title="Verifique seu e-mail" subtitle="Link de recuperação enviado">
        <p className="text-center text-sm text-muted-foreground">
          Se esse e-mail existir na nossa base, enviamos um link para você redefinir a senha.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Esqueci minha senha"
      subtitle="Vamos te enviar um link de recuperação"
      footer={
        <Link to="/login" className="text-purple-400 hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="voce@empresa.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className="text-sm font-medium text-destructive">{formError}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
