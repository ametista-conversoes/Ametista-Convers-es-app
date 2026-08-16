import { AlertTriangle, Sparkles } from 'lucide-react'
import type { CassieMessageRecord } from '@/hooks/useCassieMessages'
import { CASSIE_MODE_INFO, OUT_OF_SCOPE_REPLY } from '@/lib/cassie-modes'
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
        const isOutOfScope = !isUser && message.content.trim() === OUT_OF_SCOPE_REPLY
        const modeInfo = CASSIE_MODE_INFO[message.mode]
        const ModeIcon = modeInfo?.icon ?? Sparkles

        return (
          <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 ${
                isUser
                  ? 'bg-purple-600/15 text-foreground'
                  : isOutOfScope
                    ? 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
                    : 'bg-secondary/60 text-foreground'
              }`}
            >
              {!isUser && (
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground/80">
                  {isOutOfScope ? <AlertTriangle className="h-3 w-3 text-amber-400" /> : <ModeIcon className="h-3 w-3 text-purple-400" />}
                  {isOutOfScope ? 'Fora de escopo' : modeInfo?.label}
                </div>
              )}
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
          <div className="flex items-center gap-1.5 rounded-xl bg-secondary/60 px-4 py-3">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  )
}
