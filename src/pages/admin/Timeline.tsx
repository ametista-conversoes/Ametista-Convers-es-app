import { TimelineList } from '@/components/timeline/TimelineList'
import { useTimelineEvents } from '@/hooks/useManagerPortalData'

export default function Timeline() {
  const { data: events, isLoading } = useTimelineEvents()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Portal Gestor</p>
        <h1 className="text-2xl font-semibold text-foreground">Timeline</h1>
      </div>

      <TimelineList events={events ?? []} />
    </div>
  )
}
