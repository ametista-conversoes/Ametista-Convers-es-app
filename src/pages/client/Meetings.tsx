import { MeetingList } from '@/components/meetings/MeetingList'
import { NewMeetingDialog } from '@/components/meetings/NewMeetingDialog'
import { useAuth } from '@/contexts/AuthContext'
import { useUpcomingMeetings } from '@/hooks/useClientPortalData'

export default function Meetings() {
  const { clientId } = useAuth()
  const { data: meetings, isLoading } = useUpcomingMeetings()

  if (!clientId) {
    return (
      <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6 text-sm text-muted-foreground">
        Esta conta não está vinculada a nenhum cliente, então não há Reuniões para mostrar.
      </div>
    )
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Cliente</p>
          <h1 className="text-2xl font-semibold text-foreground">Reuniões</h1>
        </div>
        <NewMeetingDialog />
      </div>

      <MeetingList meetings={meetings ?? []} />
    </div>
  )
}
