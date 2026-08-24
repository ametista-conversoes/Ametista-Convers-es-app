import { useState } from 'react'
import { differenceInCalendarDays, format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'
import { AudioMessageBubble } from '@/components/comments/AudioMessageBubble'
import { useAuth } from '@/contexts/AuthContext'
import type { ManagerCommentRecord } from '@/hooks/useManagerPortalData'
import { useMarkNavSeen, useNavLastSeen } from '@/hooks/useNavSeen'
import { formatDateTime } from '@/lib/format'

interface ChatThreadProps {
  comments: ManagerCommentRecord[]
  /** Chave própria em nav_last_seen pra saber onde entra o divisor de
   * "Mensagens não lidas" — separada da chave '/comments'/'/client-comments'
   * que já existe pra acender a bolinha do menu (não pode reusar a mesma:
   * no Portal Gestor ela é uma só pra todos os clientes, essa aqui é por
   * conversa). */
  unreadTrackingKey: string
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function getDateSeparatorLabel(date: Date): string {
  if (isToday(date)) return 'Hoje'
  if (isYesterday(date)) return 'Ontem'
  if (differenceInCalendarDays(new Date(), date) < 7) {
    return capitalize(format(date, 'EEEE', { locale: ptBR }))
  }
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function ChatThread({ comments, unreadTrackingKey }: ChatThreadProps) {
  const { user } = useAuth()
  const { data: lastSeenMap } = useNavLastSeen()
  // Congela o valor no momento da montagem — antes do useMarkNavSeen
  // abaixo atualizar "visto por último" pra agora, o que apagaria a
  // referência que o divisor precisa pra saber o que é novo.
  const [frozenLastSeen] = useState(() => lastSeenMap?.[unreadTrackingKey])
  useMarkNavSeen(unreadTrackingKey)

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#1A2540] bg-[#131C31] p-10 text-center">
        <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Nenhum comentário deste cliente ainda.</p>
      </div>
    )
  }

  let lastDateKey = ''
  let unreadDividerShown = false

  return (
    <div className="space-y-3 rounded-xl border border-[#1A2540] bg-[#131C31] p-4 md:p-5">
      {comments.map((comment) => {
        const commentDate = new Date(comment.created_at)
        const dateKey = format(commentDate, 'yyyy-MM-dd')
        const showDateSeparator = dateKey !== lastDateKey
        lastDateKey = dateKey

        const isUnread = !!frozenLastSeen && commentDate > new Date(frozenLastSeen)
        const showUnreadDivider = isUnread && !unreadDividerShown
        if (showUnreadDivider) unreadDividerShown = true

        const isMine = !!user?.id && comment.author_id === user.id

        return (
          <div key={comment.id}>
            {showDateSeparator && (
              <div className="my-3 flex items-center justify-center">
                <span className="rounded-full bg-secondary/70 px-3 py-1 text-xs text-muted-foreground">
                  {getDateSeparatorLabel(commentDate)}
                </span>
              </div>
            )}
            {showUnreadDivider && (
              <div className="my-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-purple-600/30" />
                <span className="text-xs font-medium text-purple-400">Mensagens não lidas</span>
                <div className="h-px flex-1 bg-purple-600/30" />
              </div>
            )}
            <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  isMine ? 'bg-purple-600/15 text-foreground' : 'bg-secondary/60 text-foreground'
                }`}
              >
                {comment.title && <p className="text-sm font-semibold">{comment.title}</p>}
                {comment.audio_url ? (
                  <div className="mt-0.5">
                    <AudioMessageBubble audioPath={comment.audio_url} durationSeconds={comment.audio_duration_seconds} />
                  </div>
                ) : (
                  <p className="mt-0.5 text-sm">{comment.content}</p>
                )}
                <p className="mt-1 text-right text-xs text-muted-foreground/70">
                  {comment.author_name ?? 'Alguém'} · {formatDateTime(comment.created_at)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
