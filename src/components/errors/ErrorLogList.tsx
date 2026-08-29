import { useState } from 'react'
import { AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import type { ErrorLogRecord } from '@/hooks/useManagerPortalData'
import { useDeleteErrorLog, useResolveErrorLog } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'
import { severityLabels, severityStyles } from '@/lib/status-styles'

interface ErrorLogListProps {
  logs: ErrorLogRecord[]
  deleteMode?: boolean
}

const SOURCE_LABELS: Record<string, string> = {
  frontend: 'Front-end',
  edge_function: 'Edge Function',
}

/** Fase 21.1 — lista de erros capturados (front-end via ErrorBoundary/
 * window.onerror, Edge Function via logServerError), mesmo padrão
 * visual de IncidentAlertList/TimelineList. */
export function ErrorLogList({ logs, deleteMode }: ErrorLogListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const resolveErrorLog = useResolveErrorLog()
  const deleteErrorLog = useDeleteErrorLog()

  async function handleResolve(id: string) {
    try {
      await resolveErrorLog.mutateAsync(id)
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertOctagon className="h-4 w-4 text-purple-400" />
          Erros registrados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        {logs.length === 0 && <p className="text-sm text-muted-foreground">Nenhum erro registrado.</p>}

        {logs.map((log) => {
          const isExpanded = expandedId === log.id
          const hasDetail = Boolean(log.stack) || Boolean(log.context)
          return (
            <div key={log.id} className={`rounded-lg bg-secondary/50 px-3 py-3 ${log.resolved ? 'opacity-70' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{log.message}</p>
                <div className="flex items-center gap-2">
                  <Badge className={severityStyles[log.severity]}>{severityLabels[log.severity] ?? log.severity}</Badge>
                  <Badge variant="outline">{SOURCE_LABELS[log.source] ?? log.source}</Badge>
                  {deleteMode && (
                    <DeleteItemButton label="este log de erro" onDelete={() => deleteErrorLog.mutateAsync(log.id)} />
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {log.function_name ?? 'app'} · {formatDateTime(log.created_at)}
              </p>

              {hasDetail && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-auto gap-1 px-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {isExpanded ? 'Esconder detalhes' : 'Ver detalhes'}
                </Button>
              )}
              {isExpanded && (
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-background/60 p-3 text-xs text-muted-foreground">
                  {log.stack ?? JSON.stringify(log.context, null, 2)}
                </pre>
              )}

              {!log.resolved && (
                <div className="mt-3">
                  <Button size="sm" variant="secondary" disabled={resolveErrorLog.isPending} onClick={() => handleResolve(log.id)}>
                    Marcar como resolvido
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
