import { Sparkles } from 'lucide-react'
import type { PersuasiveCopyMessageRecord } from '@/hooks/usePersuasiveCopyMessages'
import { formatDateTime } from '@/lib/format'

interface PersuasiveCopyThreadProps {
  messages: PersuasiveCopyMessageRecord[]
  sending?: boolean
}

/** Conversa de "Comunicação Persuasiva" (Fase 8.4b) — mesmo visual de
 * `CassieChatThread.tsx`, simplificado (sem modos nem "fora de
 * escopo", que só fazem sentido no chat principal da Cassie). */
export function PersuasiveCopyThread({ messages, sending }: PersuasiveCopyThreadProps) {
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
              {!isUser && (
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground/80">
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  Cassie
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
