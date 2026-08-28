import { useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
import type { ManagerTaskRecord } from '@/hooks/useManagerPortalData'
import { useAllClients, useAllProjects, useCreateManagerTask, useUpdateManagerTask } from '@/hooks/useManagerPortalData'
import { getTodayIsoDate } from '@/lib/format'
import { taskPriorityLabels } from '@/lib/status-styles'

const TODAY = getTodayIsoDate()

const taskFormSchema = z.object({
  title: z.string().min(2, 'Digite um título'),
  clientId: z.string().min(1, 'Escolha um cliente'),
  projectId: z.string().optional(),
  category: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

const EMPTY_VALUES: TaskFormValues = { title: '', clientId: '', projectId: '', category: '', due_date: '', priority: 'medium' }

interface KanbanTaskFormDialogProps {
  trigger: ReactNode
  task?: ManagerTaskRecord
  /** Só usados quando não é edição — pra abrir já preenchido quando a
   * tarefa nasce de dentro de um cliente/projeto específico (ex: aba
   * Tarefas do detalhe de um projeto), em vez de exigir escolher nos
   * dois selects de novo. */
  defaultClientId?: string
  defaultProjectId?: string
}

/** Diálogo de criar OU editar uma tarefa do Kanban — sem `task` cria uma
 * nova; com `task`, edita a existente. Mesmo padrão do
 * `AssetFormDialog.tsx`/`WorkflowTemplateFormDialog.tsx` (reset no
 * `handleOpenChange` ao abrir). O prazo só é obrigatoriamente "não
 * passado" ao criar — editando, a tarefa pode já estar atrasada e isso
 * é um estado válido que não deve travar o resto da edição. */
export function KanbanTaskFormDialog({ trigger, task, defaultClientId, defaultProjectId }: KanbanTaskFormDialogProps) {
  const [open, setOpen] = useState(false)
  const { data: clients } = useAllClients()
  const { data: projects } = useAllProjects()
  const createTask = useCreateManagerTask()
  const updateTask = useUpdateManagerTask()
  const isEdit = !!task

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const selectedClientId = form.watch('clientId')
  const availableProjects = (projects ?? []).filter((p) => p.client_id === selectedClientId)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      form.reset(
        task
          ? {
              title: task.title,
              clientId: task.client_id,
              projectId: task.project_id ?? '',
              category: task.category ?? '',
              due_date: task.due_date ?? '',
              priority: task.priority as TaskFormValues['priority'],
            }
          : { ...EMPTY_VALUES, clientId: defaultClientId ?? '', projectId: defaultProjectId ?? '' },
      )
    }
  }

  async function onSubmit(values: TaskFormValues) {
    const input = {
      title: values.title,
      client_id: values.clientId,
      project_id: values.projectId?.trim() ? values.projectId : null,
      category: values.category?.trim() ? values.category.trim() : null,
      due_date: values.due_date?.trim() ? values.due_date : null,
      priority: values.priority,
    }
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, ...input })
        toast.success('Tarefa atualizada.')
      } else {
        await createTask.mutateAsync(input)
        toast.success('Tarefa criada.')
      }
      setOpen(false)
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Revisar criativos da campanha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue('projectId', '')
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(clients ?? []).map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto (opcional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!selectedClientId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem projeto específico" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Criativo, Técnico, Relatório" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo (opcional)</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} minDate={isEdit ? undefined : TODAY} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(taskPriorityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar tarefa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
