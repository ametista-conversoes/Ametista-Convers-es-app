import { Building2 } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useOrganization, useUpdateOrganization } from '@/hooks/useClientPortalData'

const agencySettingsSchema = z.object({
  name: z.string().min(2, 'Digite o nome da agência'),
  plan: z.string().optional(),
  status: z.string().optional(),
  domain: z.string().optional(),
})

type AgencySettingsValues = z.infer<typeof agencySettingsSchema>

export function AgencySettingsTab() {
  const { data: organization, isLoading } = useOrganization()
  const updateOrganization = useUpdateOrganization()

  const form = useForm<AgencySettingsValues>({
    resolver: zodResolver(agencySettingsSchema),
    values: organization
      ? {
          name: organization.name,
          plan: organization.plan ?? '',
          status: organization.status ?? '',
          domain: organization.domain ?? '',
        }
      : undefined,
  })

  async function onSubmit(values: AgencySettingsValues) {
    if (!organization) return
    try {
      await updateOrganization.mutateAsync({
        id: organization.id,
        name: values.name,
        plan: values.plan?.trim() ? values.plan.trim() : null,
        status: values.status?.trim() ? values.status.trim() : null,
        domain: values.domain?.trim() ? values.domain.trim() : null,
      })
      toast.success('Dados da agência atualizados.')
    } catch {
      toast.error('Não foi possível salvar os dados da agência.')
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (!organization) {
    return (
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardContent className="p-0 text-sm text-muted-foreground">Nenhuma agência cadastrada ainda.</CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-purple-400" />
          Dados da agência
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domínio (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="exemplo.com" {...field} />
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
  )
}
