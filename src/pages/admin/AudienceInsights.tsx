import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OptionBreakdownBarChart } from '@/components/charts/OptionBreakdownBarChart'
import { useAllClients, useAudienceInsights } from '@/hooks/useManagerPortalData'

/** "Públicos-Alvo" (Fase 8.3) — síntese em % das perguntas fechadas dos
 * Google Forms conectados de um cliente. 100% dinâmico: a lista de
 * perguntas/opções vem inteira de `useAudienceInsights`, nada fixo
 * aqui — quantas perguntas/formulários existirem de verdade pro
 * cliente escolhido é o que aparece. Perguntas de texto livre ficam de
 * fora (Fase 8.4). */
export default function AudienceInsights() {
  const { data: clients } = useAllClients()
  const [clientId, setClientId] = useState('')
  const { data: insights, isLoading } = useAudienceInsights(clientId || null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Públicos-Alvo</h1>
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Escolha um cliente" />
          </SelectTrigger>
          <SelectContent>
            {(clients ?? []).map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!clientId && (
        <p className="text-sm text-muted-foreground">Escolha um cliente pra ver a síntese das respostas de formulário.</p>
      )}

      {clientId && isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {clientId && !isLoading && (insights ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma pergunta fechada sincronizada ainda pra esse cliente. Conecte e sincronize um Google Forms em
          "Integrações" pra começar.
        </p>
      )}

      <div className="space-y-4">
        {(insights ?? []).map((question) => (
          <Card
            key={question.questionId}
            className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6"
          >
            <CardHeader className="p-0">
              <CardTitle className="text-base font-medium">{question.title}</CardTitle>
              <CardDescription>
                {question.totalRespondents} resposta{question.totalRespondents === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              {question.totalRespondents === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda sem respostas.</p>
              ) : (
                <OptionBreakdownBarChart data={question.options} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
