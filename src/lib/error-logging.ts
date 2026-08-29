import { supabase } from '@/lib/supabase'

/** Grava um erro do front-end em `error_logs` (Fase 21.1) — nunca
 * lança se o próprio insert falhar, só avisa no console como último
 * recurso, pra logging nunca virar uma fonte nova de erro. */
export function logClientError(error: unknown, context?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? (error.stack ?? null) : null

  supabase
    .from('error_logs')
    .insert({
      source: 'frontend',
      message,
      stack,
      context: { url: window.location.href, ...context },
    })
    .then(({ error: insertError }) => {
      if (insertError) console.error('[error-logging] não foi possível gravar o erro:', insertError)
    })
}
