import { useState } from 'react'
import { ErrorLogList } from '@/components/errors/ErrorLogList'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { Button } from '@/components/ui/button'
import { useErrorLogs } from '@/hooks/useManagerPortalData'

/** Fase 21.1/21.1b — monitoramento de erros (tipo Sentry, próprio).
 * Vive dentro de Configurações (aba só admin/gestor) em vez de item
 * de menu próprio, por pedido do usuário. */
export function ErrorLogsSettingsTab() {
  const { data: logs, isLoading, isError } = useErrorLogs()
  const [deleteMode, setDeleteMode] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }
  if (isError) {
    return <p className="text-sm text-destructive">Erro ao carregar os dados. Tente novamente.</p>
  }

  const filteredLogs = (logs ?? []).filter((log) => showResolved || !log.resolved)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />
        <Button variant="outline" size="sm" onClick={() => setShowResolved((v) => !v)}>
          {showResolved ? 'Mostrar só não resolvidos' : 'Mostrar todos'}
        </Button>
      </div>

      <ErrorLogList logs={filteredLogs} deleteMode={deleteMode} />
    </div>
  )
}
