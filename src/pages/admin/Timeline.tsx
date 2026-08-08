import { useState } from 'react'
import { Search } from 'lucide-react'
import { TimelineList } from '@/components/timeline/TimelineList'
import { Input } from '@/components/ui/input'
import { useTimelineEvents } from '@/hooks/useManagerPortalData'

export default function Timeline() {
  const { data: events, isLoading } = useTimelineEvents()
  const [search, setSearch] = useState('')

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const term = search.trim().toLowerCase()
  const filteredEvents = (events ?? []).filter(
    (event) => !term || event.action.toLowerCase().includes(term) || (event.client?.name ?? '').toLowerCase().includes(term),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Timeline</h1>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar evento..."
            className="w-64 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <TimelineList events={filteredEvents} />
    </div>
  )
}
