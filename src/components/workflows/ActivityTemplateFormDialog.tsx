import { useState, type ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ActivityTemplateRecord } from '@/hooks/useManagerPortalData'
import { useCreateActivityTemplate, useUpdateActivityTemplate } from '@/hooks/useManagerPortalData'

const templateFormSchema = z.object({
  name: z.string().min(2, 'Digite um nome'),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1, 'Digite o título do item'),
        category: z.string().optional(),
      }),
    )
    .min(1, 'Adicione pelo menos um item'),
})

type TemplateFormValues = z.infer<typeof templateFormSchema>

const EMPTY_VALUES: TemplateFormValues = {
  name: '',
  description: '',
  items: [{ title: '', category: '' }],
}

interface ActivityTemplateFormDialogProps {
  trigger: ReactNode
  template?: ActivityTemplateRecord
}

/** Diálogo de criar OU editar um Workflow de Atividades (Fase 6.6.2) —
 * checklist reutilizável de itens de texto simples (sem prazo, sem
 * vínculo com integrações reais). */
export function ActivityTemplateFormDialog({ trigger, template }: ActivityTemplateFormDialogProps) {
  const [open, setOpen] = useState(false)
  const createTemplate = useCreateActivityTemplate()
  const updateTemplate = useUpdateActivityTemplate()
  const isEdit = !!template

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      form.reset(
        template
          ? {
              name: template.name,
              description: template.description ?? '',
              items: template.items.map((item) => ({ title: item.title, category: item.category ?? '' })),
            }
          : EMPTY_VALUES,
      )
    }
  }

  async function onSubmit(values: TemplateFormValues) {
    const input = {
      name: values.name,
      description: values.description?.trim() ? values.description.trim() : null,
      items: values.items.map((item) => ({
        title: item.title,
        category: item.category?.trim() ? item.category.trim() : null,
      })),
    }
    try {
      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, ...input })
        toast.success('Workflow de Atividades atualizado.')
      } else {
        await createTemplate.mutateAsync(input)
        toast.success('Workflow de Atividades criado.')
      }
      setOpen(false)
    } catch {
      toast.error(isEdit ? 'Não foi possível atualizar o modelo.' : 'Não foi possível criar o modelo.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Workflow de Atividades' : 'Novo Workflow de Atividades'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Checklist de Criação de Ativos" {...field} />
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
                    <Textarea placeholder="Quando usar este checklist..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label>Itens do checklist</Label>
              <div className="space-y-3">
                {fields.map((fieldItem, index) => (
                  <div key={fieldItem.id} className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
                    <div className="flex-1 space-y-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Título do item" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Categoria (opcional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => append({ title: '', category: '' })}
              >
                <Plus className="h-4 w-4" />
                Adicionar item
              </Button>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar modelo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
