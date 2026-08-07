import { useState } from 'react'
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
import { useCreateWorkflowTemplate } from '@/hooks/useManagerPortalData'

const newTemplateSchema = z.object({
  name: z.string().min(2, 'Digite um nome'),
  description: z.string().optional(),
  steps: z
    .array(
      z.object({
        title: z.string().min(1, 'Digite o título da etapa'),
        category: z.string().min(1, 'Digite a categoria'),
      }),
    )
    .min(1, 'Adicione pelo menos uma etapa'),
})

type NewTemplateValues = z.infer<typeof newTemplateSchema>

export function NewWorkflowTemplateDialog() {
  const [open, setOpen] = useState(false)
  const createTemplate = useCreateWorkflowTemplate()

  const form = useForm<NewTemplateValues>({
    resolver: zodResolver(newTemplateSchema),
    defaultValues: { name: '', description: '', steps: [{ title: '', category: '' }] },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'steps' })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) form.reset()
  }

  async function onSubmit(values: NewTemplateValues) {
    try {
      await createTemplate.mutateAsync({
        name: values.name,
        description: values.description?.trim() ? values.description.trim() : null,
        steps: values.steps,
      })
      toast.success('Modelo de workflow criado.')
      form.reset()
      setOpen(false)
    } catch {
      toast.error('Não foi possível criar o modelo.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Novo modelo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo modelo de workflow</DialogTitle>
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
                    <Input placeholder="Ex: Renovação de contrato" {...field} />
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
                    <Textarea placeholder="Quando usar este modelo..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label>Etapas</Label>
              {fields.map((fieldItem, index) => (
                <div key={fieldItem.id} className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`steps.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Título da etapa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`steps.${index}.category`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Categoria (ex: Técnico, Planejamento)" {...field} />
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
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => append({ title: '', category: '' })}
              >
                <Plus className="h-4 w-4" />
                Adicionar etapa
              </Button>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Criando...' : 'Criar modelo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
