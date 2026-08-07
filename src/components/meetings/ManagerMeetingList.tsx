import { Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import type { ManagerMeetingRecord } from '@/hooks/useManagerPortalData'
import { useCancelManagerMeeting, useDeleteManagerMeeting } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'
import { meetingStatusLabels, meetingStatusStyles } from '@/lib/status-styles'
import { CancelMeetingDialog } from './CancelMeetingDialog'

interface ManagerMeetingListProps {
  meetings: ManagerMeetingRecord[]
}

export function ManagerMeetingList({ meetings }: ManagerMeetingListProps) {
  const cancelMeeting = useCancelManagerMeeting()
  const deleteMeeting = useDeleteManagerMeeting()

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-purple-400" />
          Reuniões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {meetings.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma reunião encontrada.</p>}
        {meetings.map((meeting) => (
          <div key={meeting.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{meeting.title}</p>
              <p className="text-xs text-muted-foreground">
                {meeting.client?.name ?? 'Cliente'} · {formatDateTime(meeting.date)}
              </p>
              {meeting.meeting_link && (
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:underline"
                >
                  Link da reunião
                </a>
              )}
              {meeting.status === 'cancelled' && meeting.cancellation_reason && (
                <p className="mt-1 text-xs text-muted-foreground">Motivo: {meeting.cancellation_reason}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge className={meetingStatusStyles[meeting.status]}>
                {meetingStatusLabels[meeting.status] ?? meeting.status}
              </Badge>
              {meeting.status === 'scheduled' && (
                <CancelMeetingDialog
                  meetingTitle={meeting.title}
                  onCancel={(reason) => cancelMeeting.mutateAsync({ meetingId: meeting.id, reason })}
                />
              )}
              {meeting.status === 'cancelled' && (
                <DeleteItemButton
                  label={`a reunião "${meeting.title}"`}
                  onDelete={() => deleteMeeting.mutateAsync(meeting.id)}
                />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
