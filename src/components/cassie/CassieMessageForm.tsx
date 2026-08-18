import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface CassieMessageFormProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  sending: boolean
}

export function CassieMessageForm({ value, onChange, onSend, sending }: CassieMessageFormProps) {
  function handleSubmit() {
    if (!value.trim()) return
    onSend(value.trim())
    onChange('')
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardContent className="space-y-3 p-0">
        <Textarea
          placeholder="Pergunte algo pra Cassie..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!value.trim() || sending}>
            <Send className="h-4 w-4" />
            Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
