import { useEffect, useMemo, useState } from 'react'
import { Mic, Square, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

interface AudioRecorderButtonProps {
  onSend: (blob: Blob, seconds: number) => Promise<void>
}

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function AudioRecorderButton({ onSend }: AudioRecorderButtonProps) {
  const { status, seconds, blob, start, stop, discard } = useAudioRecorder()
  const [sending, setSending] = useState(false)

  const previewUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleStart() {
    try {
      await start()
    } catch {
      toast.error('Não foi possível acessar o microfone. Verifique a permissão do navegador.')
    }
  }

  async function handleSend() {
    if (!blob) return
    setSending(true)
    try {
      await onSend(blob, seconds)
      discard()
    } catch {
      toast.error('Não foi possível enviar a mensagem de voz.')
    } finally {
      setSending(false)
    }
  }

  if (status === 'idle') {
    return (
      <Button type="button" variant="outline" size="icon" onClick={handleStart} aria-label="Gravar mensagem de voz">
        <Mic className="h-4 w-4" />
      </Button>
    )
  }

  if (status === 'recording') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
        <span className="text-sm text-foreground">{formatSeconds(seconds)}</span>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={stop} aria-label="Parar gravação">
          <Square className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5">
      {previewUrl && <audio controls src={previewUrl} className="h-8 max-w-[220px]" />}
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={discard} aria-label="Descartar gravação">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" onClick={handleSend} disabled={sending}>
        {sending ? 'Enviando...' : 'Enviar áudio'}
      </Button>
    </div>
  )
}
