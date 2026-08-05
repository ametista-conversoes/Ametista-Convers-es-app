import { useState } from 'react'
import { Plus } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCreateMeeting } from '@/hooks/useClientPortalData'
import { getTodayIsoDate } from '@/lib/format'
import { TimeSlotSelect } from './TimeSlotSelect'

const TODAY = getTodayIsoDate()

const newMeetingSchema = z.object({
  title: z.string().min(2, 'Digite um título'),
  date: z
    .string()
    .min(1, 'Escolha uma data')
    .refine((value) => value >= TODAY, { message: 'A data não pode ser no passado' }),
  time: z.string().min(1, 'Escolha um horário'),
  meeting_link: z.string().optional(),
})

type NewMeetingValues = z.infer<typeof newMeetingSchema>

export function NewMeetingDialog() {
  const [open, setOpen] = useState(false)
  const createMeeting = useCreateMeeting()

  const form = useForm<NewMeetingValues>({
    resolver: zodResolver(newMeetingSchema),
    defaultValues: { title: '', date: '', time: '', meeting_link: '' },
  })

  async function onSubmit(values: NewMeetingValues) {
    try {
      await createMeeting.mutateAsync({
        title: values.title,
        date: new Date(`${values.date}T${values.time}`).toISOString(),
        meeting_link: values.meeting_link?.trim() ? values.meeting_link.trim() : null,
      })
      form.reset()
      setOpen(false)
    } catch {
      toast.error('Não foi possível agendar a reunião.')
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) form.reset()
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" min={TODAY} {...field} />
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
