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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCreateMeeting } from '@/hooks/useClientPortalData'

const newMeetingSchema = z.object({
  title: z.string().min(2, 'Digite um título'),
  date: z.string().min(1, 'Escolha data e hora'),
  meeting_link: z.string().optional(),
})

type NewMeetingValues = z.infer<typeof newMeetingSchema>

export function NewMeetingDialog() {
  const [open, setOpen] = useState(false)
  const createMeeting = useCreateMeeting()

  const form = useForm<NewMeetingValues>({
    resolver: zodResolver(newMeetingSchema),
    defaultValues: { title: '', date: '', meeting_link: '' },
  })

  async function onSubmit(values: NewMeetingValues) {
    await createMeeting.mutateAsync({
      title: values.title,
      date: new Date(values.date).toISOString(),
      meeting_link: values.meeting_link?.trim() ? values.meeting_link.trim() : null,
    })
    form.reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
