import { useEffect, useState } from 'react'
import { CassieChatThread } from '@/components/cassie/CassieChatThread'
import { CassieHeader } from '@/components/cassie/CassieHeader'
import { CassieMessageForm } from '@/components/cassie/CassieMessageForm'
import { useAuth } from '@/contexts/AuthContext'
import { useClient } from '@/hooks/useClientPortalData'
import { useCassieMessages, useClearCassieHistory, useSendCassieMessage } from '@/hooks/useCassieMessages'
import { getAllowedCassieModes, type CassieMode } from '@/lib/cassie-modes'
import { useMarkNavSeen } from '@/hooks/useNavSeen'

export default function Cassie() {
  useMarkNavSeen('/cassie')
  const { clientId } = useAuth()
  const { data: client } = useClient()
  const { data: messages, isLoading } = useCassieMessages(clientId ?? '')
  const sendMessage = useSendCassieMessage(clientId ?? '')
  const clearHistory = useClearCassieHistory(clientId ?? '')

  const allowedModes = getAllowedCassieModes('cliente', client?.plan ?? null)
  const [mode, setMode] = useState<CassieMode>(allowedModes[0])

  useEffect(() => {
    if (!allowedModes.includes(mode)) setMode(allowedModes[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.plan])

  if (!clientId) {
    return (
      <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6 text-sm text-muted-foreground">
        Esta conta não está vinculada a nenhum cliente, então não há Cassie para mostrar.
      </div>
    )
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <CassieHeader
        plan={client?.plan}
        allowedModes={allowedModes}
        mode={mode}
        onModeChange={setMode}
        onClearHistory={() => clearHistory.mutate()}
        clearing={clearHistory.isPending}
        hasMessages={(messages ?? []).length > 0}
      />

      <CassieChatThread messages={messages ?? []} sending={sendMessage.isPending} />
      <CassieMessageForm onSend={(text) => sendMessage.mutate({ message: text, mode })} sending={sendMessage.isPending} />
    </div>
  )
}
