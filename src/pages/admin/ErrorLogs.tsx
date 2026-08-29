import { useState } from 'react'
import { ErrorLogList } from '@/components/errors/ErrorLogList'
import { DeleteModeToggle } from '@/components/shared/DeleteModeToggle'
import { Button } from '@/components/ui/button'
import { useErrorLogs } from '@/hooks/useManagerPortalData'
import { useMarkNavSeen } from '@/hooks/useNavSeen'

export default function ErrorLogs() {
  useMarkNavSeen('/errors')
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Portal Gestor</p>
            <h1 className="text-2xl font-semibold text-foreground">Erros</h1>
          </div>
          <DeleteModeToggle active={deleteMode} onToggle={() => setDeleteMode((v) => !v)} />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowResolved((v) => !v)}>
          {showResolved ? 'Mostrar só não resolvidos' : 'Mostrar todos'}
        </Button>
      </div>

      <ErrorLogList logs={filteredLogs} deleteMode={deleteMode} />
    </div>
  )
}
