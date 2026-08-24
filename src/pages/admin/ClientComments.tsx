import { useState } from 'react'
import { ChatThread } from '@/components/comments/ChatThread'
import { CommentGuidelines } from '@/components/comments/CommentGuidelines'
import { NewManagerCommentForm } from '@/components/comments/NewManagerCommentForm'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAllClients, useClientComments } from '@/hooks/useManagerPortalData'
import { useMarkNavSeen } from '@/hooks/useNavSeen'

export default function ClientComments() {
  useMarkNavSeen('/client-comments')
  const { data: clients } = useAllClients()
  const [clientId, setClientId] = useState<string>('')
  const { data: comments, isLoading } = useClientComments(clientId || null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Comentários</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {(clients ?? []).map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CommentGuidelines />
        </div>
      </div>

      {!clientId && (
        <p className="text-sm text-muted-foreground">Escolha um cliente acima para ver e responder os comentários.</p>
      )}

      {clientId && isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {clientId && !isLoading && (
        <>
          <ChatThread key={clientId} comments={comments ?? []} unreadTrackingKey={`comments:${clientId}`} />
          <NewManagerCommentForm clientId={clientId} />
        </>
      )}
    </div>
  )
}
