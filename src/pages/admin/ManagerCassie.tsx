import { useState } from 'react'
import { CassieChatThread } from '@/components/cassie/CassieChatThread'
import { CassieHeader } from '@/components/cassie/CassieHeader'
import { CassieMessageForm } from '@/components/cassie/CassieMessageForm'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCassieDraft } from '@/hooks/useCassieDraft'
import { useCassieMessages, useCassieSending, useClearCassieHistory, useSendCassieMessage } from '@/hooks/useCassieMessages'
import { useAllClients } from '@/hooks/useManagerPortalData'
import { useMarkNavSeen } from '@/hooks/useNavSeen'
import { CASSIE_MODES, type CassieMode } from '@/lib/cassie-modes'

export default function ManagerCassie() {
  useMarkNavSeen('/client-cassie')
  const { data: clients } = useAllClients()
  const [clientId, setClientId] = useState<string>('')
  const [mode, setMode] = useState<CassieMode>(CASSIE_MODES[0])

  const { data: messages, isLoading } = useCassieMessages(clientId)
  const sendMessage = useSendCassieMessage(clientId)
  const clearHistory = useClearCassieHistory(clientId)
  const isSending = useCassieSending(clientId)
  const [draft, setDraft] = useCassieDraft(clientId)

  const selectedClient = (clients ?? []).find((client) => client.id === clientId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Cassie IA</h1>
        </div>
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
      </div>

      {!clientId && (
        <p className="text-sm text-muted-foreground">Escolha um cliente acima para conversar com a Cassie sobre ele.</p>
      )}

      {clientId && (
        <>
          <CassieHeader
            plan={selectedClient?.plan}
            allowedModes={CASSIE_MODES}
            mode={mode}
            onModeChange={setMode}
            onClearHistory={() => clearHistory.mutate()}
            clearing={clearHistory.isPending}
            hasMessages={(messages ?? []).length > 0}
          />

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <CassieChatThread messages={messages ?? []} sending={isSending} />
          )}

          <CassieMessageForm
            value={draft}
            onChange={setDraft}
            onSend={(text) => sendMessage.mutate({ message: text, mode })}
            sending={isSending}
          />
        </>
      )}
    </div>
  )
}
