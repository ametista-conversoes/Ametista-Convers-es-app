import { EmergencyMeetingDialog } from '@/components/meetings/EmergencyMeetingDialog'
import { MeetingList } from '@/components/meetings/MeetingList'
import { UnlinkedClientNotice } from '@/components/shared/UnlinkedClientNotice'
import { useAuth } from '@/contexts/AuthContext'
import { useUpcomingMeetings } from '@/hooks/useClientPortalData'
import { useMarkNavSeen } from '@/hooks/useNavSeen'

export default function Meetings() {
  useMarkNavSeen('/meetings')
  const { clientId } = useAuth()
  const { data: meetings, isLoading } = useUpcomingMeetings()

  if (!clientId) {
    return <UnlinkedClientNotice page="Reuniões" />
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
        <EmergencyMeetingDialog />
      </div>

      <MeetingList meetings={meetings ?? []} />
    </div>
  )
}
