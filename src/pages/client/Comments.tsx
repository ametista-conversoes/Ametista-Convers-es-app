import { CommentFeed } from '@/components/comments/CommentFeed'
import { CommentGuidelines } from '@/components/comments/CommentGuidelines'
import { NewCommentForm } from '@/components/comments/NewCommentForm'
import { useAuth } from '@/contexts/AuthContext'
import { useComments } from '@/hooks/useClientPortalData'

export default function Comments() {
  const { clientId } = useAuth()
  const { data: comments, isLoading } = useComments()

  if (!clientId) {
    return (
      <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6 text-sm text-muted-foreground">
        Esta conta não está vinculada a nenhum cliente, então não há Comentários para mostrar.
      </div>
    )
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

      <NewCommentForm />
      <CommentFeed comments={comments ?? []} />
    </div>
  )
}
