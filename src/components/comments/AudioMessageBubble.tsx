import { useState } from 'react'
import { Play } from 'lucide-react'
import { getFileSignedUrl } from '@/lib/storage'

interface AudioMessageBubbleProps {
  audioPath: string
  durationSeconds: number | null
}

function formatDuration(total: number | null): string {
  if (total === null) return ''
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** URL assinada só é buscada quando a pessoa aperta play — evita gastar
 * link assinado pra mensagem de voz que ninguém vai ouvir. Mesmo padrão
 * "path ou http direto" já usado em FileList.tsx. */
export function AudioMessageBubble({ audioPath, durationSeconds }: AudioMessageBubbleProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePlay() {
    if (resolvedUrl || loading) return
    setLoading(true)
    try {
      const url = audioPath.startsWith('http') ? audioPath : await getFileSignedUrl(audioPath)
      setResolvedUrl(url)
    } finally {
      setLoading(false)
    }
  }

  if (resolvedUrl) {
    return <audio controls autoPlay src={resolvedUrl} className="h-9 max-w-[240px]" />
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={loading}
      className="flex items-center gap-2 rounded-full bg-secondary/70 px-3 py-1.5 text-sm text-foreground hover:bg-secondary"
    >
      <Play className="h-4 w-4 shrink-0" />
      {loading ? 'Carregando...' : `Mensagem de voz${durationSeconds !== null ? ` · ${formatDuration(durationSeconds)}` : ''}`}
    </button>
  )
}
