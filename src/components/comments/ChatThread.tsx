import { MessageSquare } from 'lucide-react'
import type { ManagerCommentRecord } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'

interface ChatThreadProps {
  comments: ManagerCommentRecord[]
}

export function ChatThread({ comments }: ChatThreadProps) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#1A2540] bg-[#131C31] p-10 text-center">
        <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Nenhum comentário deste cliente ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#1A2540] bg-[#131C31] p-4 md:p-5">
      {comments.map((comment) => {
        const isAgency = comment.author_role === 'admin' || comment.author_role === 'gestor'
        return (
          <div key={comment.id} className={`flex ${isAgency ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 ${
                isAgency ? 'bg-purple-600/15 text-foreground' : 'bg-secondary/60 text-foreground'
              }`}
            >
              {comment.title && <p className="text-sm font-semibold">{comment.title}</p>}
              <p className="mt-0.5 text-sm">{comment.content}</p>
              <p className="mt-1 text-right text-xs text-muted-foreground/70">
                {comment.author_name ?? 'Alguém'} · {formatDateTime(comment.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
