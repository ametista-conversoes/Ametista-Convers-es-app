import { useEffect, useState } from 'react'
import { CassieChatThread } from '@/components/cassie/CassieChatThread'
import { CassieHeader } from '@/components/cassie/CassieHeader'
import { CassieMessageForm } from '@/components/cassie/CassieMessageForm'
import { UnlinkedClientNotice } from '@/components/shared/UnlinkedClientNotice'
import { useAuth } from '@/contexts/AuthContext'
import { useClient } from '@/hooks/useClientPortalData'
import { useCassieDraft } from '@/hooks/useCassieDraft'
import { useCassieMessages, useCassieSending, useClearCassieHistory, useSendCassieMessage } from '@/hooks/useCassieMessages'
import { getAllowedCassieModes, type CassieMode } from '@/lib/cassie-modes'
import { useMarkNavSeen } from '@/hooks/useNavSeen'

export default function Cassie() {
  useMarkNavSeen('/cassie')
  const { clientId } = useAuth()
  const { data: client } = useClient()
  const { data: messages, isLoading } = useCassieMessages(clientId ?? '')
  const sendMessage = useSendCassieMessage(clientId ?? '')
  const clearHistory = useClearCassieHistory(clientId ?? '')
  const isSending = useCassieSending(clientId ?? '')
  const [draft, setDraft] = useCassieDraft(clientId ?? '')

  const allowedModes = getAllowedCassieModes('cliente', client?.plan ?? null)
  const [mode, setMode] = useState<CassieMode>(allowedModes[0])

  useEffect(() => {
    if (!allowedModes.includes(mode)) setMode(allowedModes[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.plan])

  if (!clientId) {
    return <UnlinkedClientNotice page="Cassie" />
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

      <CassieChatThread messages={messages ?? []} sending={isSending} />
      <CassieMessageForm
        value={draft}
        onChange={setDraft}
        onSend={(text) => sendMessage.mutate({ message: text, mode })}
        sending={isSending}
      />
    </div>
  )
}
