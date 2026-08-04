import { MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CommentRecord } from '@/hooks/useClientPortalData'
import { formatDateTime } from '@/lib/format'
import { roleLabels, roleStyles } from '@/lib/status-styles'

interface CommentFeedProps {
  comments: CommentRecord[]
}

export function CommentFeed({ comments }: CommentFeedProps) {
  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-purple-400" />
          Mural de comentários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {comments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>}
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg bg-secondary/50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">{comment.author_name ?? 'Alguém'}</p>
              {comment.author_role && (
                <Badge className={roleStyles[comment.author_role]}>
                  {roleLabels[comment.author_role] ?? comment.author_role}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground/70">{formatDateTime(comment.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-foreground">{comment.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
