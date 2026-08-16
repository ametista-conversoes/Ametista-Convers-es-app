import { useState } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useSendCassieMessage } from '@/hooks/useCassieMessages'

export function CassieMessageForm() {
  const [message, setMessage] = useState('')
  const sendMessage = useSendCassieMessage()

  async function handleSubmit() {
    if (!message.trim()) return
    const text = message.trim()
    setMessage('')
    try {
      await sendMessage.mutateAsync(text)
    } catch {
      toast.error('Não foi possível falar com a Cassie.')
    }
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardContent className="space-y-3 p-0">
        <Textarea
          placeholder="Pergunte algo pra Cassie..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!message.trim() || sendMessage.isPending}>
            <Send className="h-4 w-4" />
            {sendMessage.isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
