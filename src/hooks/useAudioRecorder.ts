import { useCallback, useRef, useState } from 'react'

/** Teto de segurança pra gravação de mensagem de voz — para sozinho
 * ao chegar aqui, evita um arquivo gigante enviado sem querer. */
const MAX_DURATION_SECONDS = 180

export type AudioRecorderStatus = 'idle' | 'recording' | 'recorded'

function pickSupportedMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  for (const type of candidates) {
    if (window.MediaRecorder?.isTypeSupported?.(type)) return type
  }
  return ''
}

export function useAudioRecorder() {
  const [status, setStatus] = useState<AudioRecorderStatus>('idle')
  const [seconds, setSeconds] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    chunksRef.current = []
    const mimeType = pickSupportedMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      setBlob(new Blob(chunksRef.current, { type: mimeType || 'audio/webm' }))
      setStatus('recorded')
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }

    recorder.start()
    setStatus('recording')
    setSeconds(0)
    timerRef.current = setInterval(() => {
      setSeconds((current) => {
        const next = current + 1
        if (next >= MAX_DURATION_SECONDS) recorder.stop()
        return next
      })
    }, 1000)
  }, [])

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  const discard = useCallback(() => {
    setBlob(null)
    setStatus('idle')
    setSeconds(0)
  }, [])

  return { status, seconds, blob, start, stop, discard }
}
