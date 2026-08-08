import { useState } from 'react'
import { ManagerMeetingList } from '@/components/meetings/ManagerMeetingList'
import { MeetingRecurrenceDialog } from '@/components/meetings/MeetingRecurrenceDialog'
import { NewManagerMeetingDialog } from '@/components/meetings/NewManagerMeetingDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllClients, useAllMeetings } from '@/hooks/useManagerPortalData'
import { useMarkNavSeen } from '@/hooks/useNavSeen'

const ALL_CLIENTS = 'all'

export default function ManagerMeetings() {
  useMarkNavSeen('/client-meetings')
  const { data: clients } = useAllClients()
  const { data: meetings, isLoading } = useAllMeetings()
  const [clientFilter, setClientFilter] = useState(ALL_CLIENTS)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  const filteredMeetings = (meetings ?? []).filter(
    (meeting) => clientFilter === ALL_CLIENTS || meeting.client_id === clientFilter,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Reuniões</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLIENTS}>Todos os clientes</SelectItem>
              {(clients ?? []).map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <MeetingRecurrenceDialog />
          <NewManagerMeetingDialog />
        </div>
      </div>

      <ManagerMeetingList meetings={filteredMeetings} />
    </div>
  )
}
