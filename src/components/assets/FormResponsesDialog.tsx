import { useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useFormQuestions, useFormResponses } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'

interface FormResponsesDialogProps {
  trigger: ReactNode
  connectionId: string
}

/** Vitrine das respostas estruturadas sincronizadas de um Google Forms
 * conectado (Fase 8.2) — confirma visualmente que a sincronização
 * trouxe pergunta+resposta reais (não só o Alerta genérico de sempre).
 * A síntese em % das perguntas fechadas fica pra Fase 8.3. */
export function FormResponsesDialog({ trigger, connectionId }: FormResponsesDialogProps) {
  const [open, setOpen] = useState(false)
  const { data: questions } = useFormQuestions(open ? connectionId : null)
  const { data: responses, isLoading } = useFormResponses(open ? connectionId : null)

  const questionTitles = new Map((questions ?? []).map((q) => [q.external_question_id, q.title]))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Respostas do formulário</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!isLoading && (responses ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma resposta sincronizada ainda. Clique em "Sincronizar agora" pra buscar as respostas reais direto do
            Google Forms.
          </p>
        )}

        <div className="space-y-3">
          {(responses ?? []).map((response) => (
            <div key={response.id} className="rounded-lg bg-secondary/30 p-3 text-sm">
              <p className="mb-2 text-xs text-muted-foreground">{formatDateTime(response.submitted_at)}</p>
              <div className="space-y-1.5">
                {response.form_answers.map((answer) => (
                  <div key={answer.external_question_id}>
                    <p className="text-xs text-muted-foreground">
                      {questionTitles.get(answer.external_question_id) ?? answer.external_question_id}
                    </p>
                    <p className="text-foreground">{answer.answer_text ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
