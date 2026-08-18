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
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { WorkflowTemplateRecord } from '@/hooks/useManagerPortalData'
import { useActivityTemplates, useCreateWorkflowTemplate, useUpdateWorkflowTemplate } from '@/hooks/useManagerPortalData'

const templateFormSchema = z.object({
  name: z.string().min(2, 'Digite um nome'),
  description: z.string().optional(),
  steps: z
    .array(
      z.object({
        title: z.string().min(1, 'Digite o título da etapa'),
        category: z.string().min(1, 'Digite a categoria'),
        // Texto, não número, pra aceitar vazio (etapa sem prazo) sem
        // luta com o tipo — convertido pra número (ou null) no submit.
        due_days: z
          .string()
          .optional()
          .refine((v) => !v || /^\d+$/.test(v), 'Digite um número de dias válido'),
      }),
    )
    .min(1, 'Adicione pelo menos uma etapa'),
  activity_template_ids: z.array(z.string()),
})

type TemplateFormValues = z.infer<typeof templateFormSchema>

const EMPTY_VALUES: TemplateFormValues = {
  name: '',
  description: '',
  steps: [{ title: '', category: '', due_days: '' }],
  activity_template_ids: [],
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
                <Input placeholder="Categoria (ex: Técnico, Planejamento)" {...field} />
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
        aria-label={`Remover etapa ${index + 1}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface WorkflowTemplateFormDialogProps {
  trigger: ReactNode
  template?: WorkflowTemplateRecord
}

/** Diálogo de criar OU editar um modelo de workflow — sem `template`
 * cria um novo; com `template`, edita o existente (admin-only, a
 * política do banco já garante isso). As etapas podem ser reordenadas
 * arrastando (`@dnd-kit/sortable`), usando o `move()` que o próprio
 * `useFieldArray` do react-hook-form já oferece. */
export function WorkflowTemplateFormDialog({ trigger, template }: WorkflowTemplateFormDialogProps) {
  const [open, setOpen] = useState(false)
  const createTemplate = useCreateWorkflowTemplate()
  const updateTemplate = useUpdateWorkflowTemplate()
  const { data: activityTemplates } = useActivityTemplates()
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
              activity_template_ids: template.activity_template_ids,
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
      activity_template_ids: values.activity_template_ids,
    }
    try {
      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, ...input })
        toast.success('Modelo de workflow atualizado.')
      } else {
        await createTemplate.mutateAsync(input)
        toast.success('Modelo de workflow criado.')
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
          <DialogTitle>{isEdit ? 'Editar modelo de workflow' : 'Novo modelo de workflow'}</DialogTitle>
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

            <FormField
              control={form.control}
              name="activity_template_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workflows de Atividades vinculados (opcional)</FormLabel>
                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {(activityTemplates ?? []).map((activityTemplate) => (
                      <label
                        key={activityTemplate.id}
                        className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm"
                      >
                        <Checkbox
                          checked={field.value.includes(activityTemplate.id)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked === true
                                ? [...field.value, activityTemplate.id]
                                : field.value.filter((id) => id !== activityTemplate.id),
                            )
                          }
                        />
                        <span className="text-foreground">{activityTemplate.name}</span>
                      </label>
                    ))}
                    {(activityTemplates ?? []).length === 0 && (
                      <p className="text-xs text-muted-foreground">Nenhum Workflow de Atividades cadastrado ainda.</p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
