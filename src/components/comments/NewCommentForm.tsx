import { useState } from 'react'
import { Send } from 'lucide-react'
import { AudioRecorderButton } from '@/components/comments/AudioRecorderButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateComment } from '@/hooks/useClientPortalData'
import { uploadClientFile } from '@/lib/storage'

export function NewCommentForm() {
  const { clientId } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const createComment = useCreateComment()

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) return
    try {
      await createComment.mutateAsync({ title: title.trim(), content: content.trim() })
      setTitle('')
      setContent('')
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  async function handleSendAudio(blob: Blob, seconds: number) {
    if (!clientId) return
    const file = new File([blob], 'mensagem-de-voz.webm', { type: blob.type })
    const path = await uploadClientFile(file, clientId)
    await createComment.mutateAsync({
      title: null,
      content: 'Mensagem de voz',
      audioUrl: path,
      audioDurationSeconds: seconds,
    })
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardContent className="space-y-3 p-0">
        <Input
          placeholder='Título — inclua o tópico entre colchetes, ex: "Dúvida sobre o criativo [anuncio]"'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Escreva um comentário para a agência..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AudioRecorderButton onSend={handleSendAudio} />
          <Button onClick={handleSubmit} disabled={!title.trim() || !content.trim() || createComment.isPending}>
            <Send className="h-4 w-4" />
            {createComment.isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
