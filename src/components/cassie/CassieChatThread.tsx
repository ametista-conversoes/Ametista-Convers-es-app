import { Sparkles } from 'lucide-react'
import type { CassieMessageRecord } from '@/hooks/useCassieMessages'
import { formatDateTime } from '@/lib/format'

interface CassieChatThreadProps {
  messages: CassieMessageRecord[]
  sending?: boolean
}

export function CassieChatThread({ messages, sending }: CassieChatThreadProps) {
  if (messages.length === 0 && !sending) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#1A2540] bg-[#131C31] p-10 text-center">
        <Sparkles className="h-6 w-6 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Pergunte sobre seu desempenho, peça sugestões ou tire dúvidas de marketing.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#1A2540] bg-[#131C31] p-4 md:p-5">
      {messages.map((message) => {
        const isUser = message.role === 'user'
        return (
          <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 ${
                isUser ? 'bg-purple-600/15 text-foreground' : 'bg-secondary/60 text-foreground'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="mt-1 text-right text-xs text-muted-foreground/70">
                {isUser ? 'Você' : 'Cassie'} · {formatDateTime(message.created_at)}
              </p>
            </div>
          </div>
        )
      })}
      {sending && (
        <div className="flex justify-start">
          <div className="rounded-xl bg-secondary/60 px-3 py-2 text-sm text-muted-foreground">
            Cassie está digitando...
          </div>
        </div>
      )}
    </div>
  )
}
