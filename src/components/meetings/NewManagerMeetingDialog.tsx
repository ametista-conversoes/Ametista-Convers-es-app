import { useState } from 'react'
import { Plus } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { useAllClients, useCreateManagerMeeting } from '@/hooks/useManagerPortalData'
import { getTodayIsoDate } from '@/lib/format'
import { TimeSlotSelect } from './TimeSlotSelect'

const TODAY = getTodayIsoDate()

const newMeetingSchema = z.object({
  title: z.string().min(2, 'Digite um título'),
  clientId: z.string().min(1, 'Escolha um cliente'),
  date: z
    .string()
    .min(1, 'Escolha uma data')
    .refine((value) => value >= TODAY, { message: 'A data não pode ser no passado' }),
  time: z.string().min(1, 'Escolha um horário'),
  meeting_link: z.string().optional(),
})

type NewMeetingValues = z.infer<typeof newMeetingSchema>

export function NewManagerMeetingDialog() {
  const [open, setOpen] = useState(false)
  const { data: clients } = useAllClients()
  const createMeeting = useCreateManagerMeeting()

  const form = useForm<NewMeetingValues>({
    resolver: zodResolver(newMeetingSchema),
    defaultValues: { title: '', clientId: '', date: '', time: '', meeting_link: '' },
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) form.reset()
  }

  async function onSubmit(values: NewMeetingValues) {
    try {
      await createMeeting.mutateAsync({
        title: values.title,
        client_id: values.clientId,
        date: new Date(`${values.date}T${values.time}`).toISOString(),
        meeting_link: values.meeting_link?.trim() ? values.meeting_link.trim() : null,
      })
      form.reset()
      setOpen(false)
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Agendar reunião
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar reunião</DialogTitle>
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
                    <Input placeholder="Ex: Reunião de alinhamento mensal" {...field} />
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
                  <Select value={field.value} onValueChange={field.onChange}>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} minDate={TODAY} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <TimeSlotSelect value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="meeting_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link da reunião (opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://meet.exemplo.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Agendando...' : 'Agendar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
