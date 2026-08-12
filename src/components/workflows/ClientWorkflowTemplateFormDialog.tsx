import { useState, type ReactNode } from 'react'
import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { type Control, useFieldArray, useForm } from 'react-hook-form'
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
import type { ClientWorkflowTemplateRecord } from '@/hooks/useManagerPortalData'
import { useCreateClientWorkflowTemplate, useUpdateClientWorkflowTemplate } from '@/hooks/useManagerPortalData'

const templateFormSchema = z.object({
  name: z.string().min(2, 'Digite um nome'),
  description: z.string().optional(),
  steps: z
    .array(
      z.object({
        title: z.string().min(1, 'Digite o título da etapa'),
        category: z.string().min(1, 'Digite a categoria'),
        due_days: z
          .string()
          .optional()
          .refine((v) => !v || /^\d+$/.test(v), 'Digite um número de dias válido'),
      }),
    )
    .min(1, 'Adicione pelo menos uma etapa'),
})

type TemplateFormValues = z.infer<typeof templateFormSchema>

const EMPTY_VALUES: TemplateFormValues = {
  name: '',
  description: '',
  steps: [{ title: '', category: '', due_days: '' }],
}

interface SortableStepRowProps {
  id: string
  index: number
  control: Control<TemplateFormValues>
  onRemove: () => void
  disableRemove: boolean
}

function SortableStepRow({ id, index, control, onRemove, disableRemove }: SortableStepRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-2 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 space-y-2">
        <FormField
          control={control}
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
          control={control}
          name={`steps.${index}.category`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Categoria (ex: Onboarding, Financeiro)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`steps.${index}.due_days`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="number" min="1" placeholder="Prazo em dias (opcional)" {...field} />
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
        disabled={disableRemove}
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface ClientWorkflowTemplateFormDialogProps {
  trigger: ReactNode
  template?: ClientWorkflowTemplateRecord
}

/** Diálogo de criar OU editar um modelo de "Workflows do Cliente"
 * (Fase 6.5.2) — mesmo padrão de `WorkflowTemplateFormDialog.tsx`
 * (etapas arrastáveis com prazo em dias), só que os modelos daqui são
 * aplicados direto a clientes (ver `ApplyClientWorkflowDialog.tsx`),
 * sem passar por um projeto. Admin-only, a política do banco garante. */
export function ClientWorkflowTemplateFormDialog({ trigger, template }: ClientWorkflowTemplateFormDialogProps) {
  const [open, setOpen] = useState(false)
  const createTemplate = useCreateClientWorkflowTemplate()
  const updateTemplate = useUpdateClientWorkflowTemplate()
  const isEdit = !!template

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: 'steps' })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      form.reset(
        template
          ? {
              name: template.name,
              description: template.description ?? '',
              steps: template.steps.map((step) => ({
                title: step.title,
                category: step.category,
                due_days: step.due_days ? String(step.due_days) : '',
              })),
            }
          : EMPTY_VALUES,
      )
    }
  }

  async function onSubmit(values: TemplateFormValues) {
    const input = {
      name: values.name,
      description: values.description?.trim() ? values.description.trim() : null,
      steps: values.steps.map((step) => ({
        title: step.title,
        category: step.category,
        due_days: step.due_days?.trim() ? Number(step.due_days) : null,
      })),
    }
    try {
      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, ...input })
        toast.success('Modelo de workflow do cliente atualizado.')
      } else {
        await createTemplate.mutateAsync(input)
        toast.success('Modelo de workflow do cliente criado.')
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
          <DialogTitle>{isEdit ? 'Editar modelo de workflow do cliente' : 'Novo modelo de workflow do cliente'}</DialogTitle>
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
                    <Input placeholder="Ex: Checklist de onboarding" {...field} />
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {fields.map((fieldItem, index) => (
                      <SortableStepRow
                        key={fieldItem.id}
                        id={fieldItem.id}
                        index={index}
                        control={form.control}
                        onRemove={() => remove(index)}
                        disableRemove={fields.length === 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => append({ title: '', category: '', due_days: '' })}
              >
                <Plus className="h-4 w-4" />
                Adicionar etapa
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
