import { useState } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useCreateComment } from '@/hooks/useClientPortalData'

export function NewCommentForm() {
  const [content, setContent] = useState('')
  const createComment = useCreateComment()

  async function handleSubmit() {
    if (!content.trim()) return
    try {
      await createComment.mutateAsync(content.trim())
      setContent('')
    } catch {
      toast.error('Não foi possível enviar o comentário.')
    }
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardContent className="space-y-3 p-0">
        <Textarea
          placeholder="Escreva um comentário para a agência..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!content.trim() || createComment.isPending}>
            <Send className="h-4 w-4" />
            {createComment.isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
