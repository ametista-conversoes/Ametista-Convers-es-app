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
import {
  useAllClients,
  useAllOnboardingSteps,
  useAllProjects,
  useCreateOnboardingStep,
} from '@/hooks/useManagerPortalData'

const newStepSchema = z.object({
  title: z.string().min(2, 'Digite um título'),
  clientId: z.string().min(1, 'Escolha um cliente'),
  projectId: z.string().optional(),
  category: z.string().optional(),
})

type NewStepValues = z.infer<typeof newStepSchema>

export function NewOnboardingStepDialog() {
  const [open, setOpen] = useState(false)
  const { data: clients } = useAllClients()
  const { data: projects } = useAllProjects()
  const { data: existingSteps } = useAllOnboardingSteps()
  const createStep = useCreateOnboardingStep()

  const form = useForm<NewStepValues>({
    resolver: zodResolver(newStepSchema),
    defaultValues: { title: '', clientId: '', projectId: '', category: '' },
  })

  const selectedClientId = form.watch('clientId')
  const availableProjects = (projects ?? []).filter((p) => p.client_id === selectedClientId)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) form.reset()
  }

  async function onSubmit(values: NewStepValues) {
    try {
      const stepsForClient = (existingSteps ?? []).filter((step) => step.client_id === values.clientId)
      await createStep.mutateAsync({
        title: values.title,
        client_id: values.clientId,
        project_id: values.projectId?.trim() ? values.projectId : null,
        category: values.category?.trim() ? values.category.trim() : null,
        step_order: stepsForClient.length,
      })
      form.reset()
      setOpen(false)
    } catch {
      toast.error('Não foi possível criar a etapa.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nova etapa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova etapa de onboarding</DialogTitle>
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
                    <Input placeholder="Ex: Assinatura de contrato" {...field} />
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
                    <Input placeholder="Ex: Jurídico, Técnico, Relacionamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Criando...' : 'Criar etapa'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
