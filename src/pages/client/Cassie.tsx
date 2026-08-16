import { CassieChatThread } from '@/components/cassie/CassieChatThread'
import { CassieMessageForm } from '@/components/cassie/CassieMessageForm'
import { useAuth } from '@/contexts/AuthContext'
import { useCassieMessages, useSendCassieMessage } from '@/hooks/useCassieMessages'
import { useMarkNavSeen } from '@/hooks/useNavSeen'

export default function Cassie() {
  useMarkNavSeen('/cassie')
  const { clientId } = useAuth()
  const { data: messages, isLoading } = useCassieMessages()
  const sendMessage = useSendCassieMessage()

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
      <div>
        <p className="text-sm text-muted-foreground">Portal Cliente</p>
        <h1 className="text-2xl font-semibold text-foreground">Cassie IA</h1>
      </div>

      <CassieChatThread messages={messages ?? []} sending={sendMessage.isPending} />
      <CassieMessageForm />
    </div>
  )
}
