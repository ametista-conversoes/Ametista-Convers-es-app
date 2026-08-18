import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// O rascunho fica em localStorage (não em useState simples) porque a
// página da Cassie é desmontada pelo React Router ao trocar de aba —
// sem isso, o texto digitado e ainda não enviado se perde.
export function useCassieDraft(clientId: string) {
  const { user } = useAuth()
  const storageKey = user?.id && clientId ? `cassie-draft:${user.id}:${clientId}` : null

  const [draft, setDraftState] = useState<string>(() => (storageKey ? (localStorage.getItem(storageKey) ?? '') : ''))

  useEffect(() => {
    setDraftState(storageKey ? (localStorage.getItem(storageKey) ?? '') : '')
  }, [storageKey])

  const setDraft = useCallback(
    (value: string) => {
      setDraftState(value)
      if (!storageKey) return
      if (value) {
        localStorage.setItem(storageKey, value)
      } else {
        localStorage.removeItem(storageKey)
      }
    },
    [storageKey],
  )

  return [draft, setDraft] as const
}
