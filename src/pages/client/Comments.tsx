import { ChatThread } from '@/components/comments/ChatThread'
import { CommentGuidelines } from '@/components/comments/CommentGuidelines'
import { NewCommentForm } from '@/components/comments/NewCommentForm'
import { UnlinkedClientNotice } from '@/components/shared/UnlinkedClientNotice'
import { useAuth } from '@/contexts/AuthContext'
import { useComments } from '@/hooks/useClientPortalData'
import { useMarkNavSeen } from '@/hooks/useNavSeen'

export default function Comments() {
  useMarkNavSeen('/comments')
  const { clientId } = useAuth()
  const { data: comments, isLoading } = useComments()

  if (!clientId) {
    return <UnlinkedClientNotice page="Comentários" />
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Portal Cliente</p>
          <h1 className="text-2xl font-semibold text-foreground">Comentários</h1>
        </div>
        <CommentGuidelines />
      </div>

      <ChatThread comments={comments ?? []} />
      <NewCommentForm />
    </div>
  )
}
