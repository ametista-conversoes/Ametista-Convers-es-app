import { useState } from 'react'
import { Plus } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CampaignLinkField } from '@/components/project/CampaignLinkField'
import { useAddProjectCampaignLink, useCreateProject } from '@/hooks/useManagerPortalData'

const newProjectSchema = z.object({
  title: z.string().min(2, 'Digite o nome do projeto'),
  objective: z.string().optional(),
  description: z.string().optional(),
  external_connection_id: z.string().nullable(),
  external_campaign_id: z.string().nullable(),
  external_campaign_name: z.string().nullable(),
  conversion_type: z.enum(['vendas', 'leads']),
  test_type: z.enum(['nenhum', 'segmentacao', 'anuncio', 'campanha']),
})

type NewProjectValues = z.infer<typeof newProjectSchema>

interface NewProjectDialogProps {
  clientId: string
}

/** Criação de projeto — por enquanto só nome/objetivo/descrição (sem
 * status/métricas/datas nesta rodada). Fica na Central de Informações
 * do Cliente porque é o único lugar do Portal Gestor que tem o
 * `clientId` já em contexto. */
export function NewProjectDialog({ clientId }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const createProject = useCreateProject()
  const addCampaignLink = useAddProjectCampaignLink()

  const form = useForm<NewProjectValues>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      title: '',
      objective: '',
      description: '',
      external_connection_id: null,
      external_campaign_id: null,
      external_campaign_name: null,
      conversion_type: 'leads',
      test_type: 'nenhum',
    },
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) form.reset()
  }

  async function onSubmit(values: NewProjectValues) {
    try {
      const project = await createProject.mutateAsync({
        title: values.title,
        client_id: clientId,
        objective: values.objective?.trim() ? values.objective.trim() : null,
        description: values.description?.trim() ? values.description.trim() : null,
        conversion_type: values.conversion_type,
        test_type: values.test_type,
      })
      if (values.external_connection_id && values.external_campaign_id) {
        await addCampaignLink.mutateAsync({
          project_id: project.id,
          connection_id: values.external_connection_id,
          external_campaign_id: values.external_campaign_id,
          external_campaign_name: values.external_campaign_name,
        })
      }
      toast.success('Projeto criado.')
      form.reset()
      setOpen(false)
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Novo projeto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Campanha de Verão 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Gerar leads qualificados" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes gerais sobre o projeto..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conversion_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de conversão</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="vendas">Vendas (e-commerce, produto direto)</SelectItem>
                      <SelectItem value="leads">Leads (com processo de fechamento)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {field.value === 'vendas'
                      ? 'Cada conversão já é uma venda — sem etapa de fechamento.'
                      : 'Cada conversão é um lead que ainda precisa fechar (ex: casas, carros, serviços).'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="test_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de teste A/B (opcional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      <SelectItem value="segmentacao">Segmentação</SelectItem>
                      <SelectItem value="anuncio">Anúncio</SelectItem>
                      <SelectItem value="campanha">Campanha</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Diferente de "Nenhum" ganha uma aba "Testes" comparando as campanhas vinculadas como variantes —
                    dá pra vincular mais de uma depois, na aba Campanha do projeto.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Campanha vinculada (opcional)</p>
              <CampaignLinkField
                clientId={clientId}
                value={{
                  externalConnectionId: form.watch('external_connection_id'),
                  externalCampaignId: form.watch('external_campaign_id'),
                  externalCampaignName: form.watch('external_campaign_name'),
                }}
                onChange={(next) => {
                  form.setValue('external_connection_id', next.externalConnectionId)
                  form.setValue('external_campaign_id', next.externalCampaignId)
                  form.setValue('external_campaign_name', next.externalCampaignName)
                }}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Criando...' : 'Criar projeto'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
