import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OptionBreakdownBarChart } from '@/components/charts/OptionBreakdownBarChart'
import { useOpenTextAnswers } from '@/hooks/useManagerPortalData'
import { generatePersuasiveCopy } from '@/lib/cassie'
import { extractWordFrequency } from '@/lib/word-frequency'

interface PersuasiveCopyPanelProps {
  clientId: string
  connectionIds: string[]
  connectionId?: string
}

/** Fase 8.4, "Comunicação Persuasiva" — palavras mais frequentes das
 * respostas abertas (`extractWordFrequency`, função pura testada) +
 * botão pra pedir sugestões de headline/texto pra Cassie
 * (`generatePersuasiveCopy`, via OpenAI). Sugestões não ficam salvas —
 * cada clique gera um resultado novo. */
export function PersuasiveCopyPanel({ clientId, connectionIds, connectionId }: PersuasiveCopyPanelProps) {
  const { data: answers, isLoading } = useOpenTextAnswers(clientId, connectionIds)
  const [suggestions, setSuggestions] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const result = await generatePersuasiveCopy({ clientId, connectionId })
      setSuggestions(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar sugestões.')
    } finally {
      setGenerating(false)
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>

  if ((answers ?? []).length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma resposta de pergunta aberta sincronizada ainda pra esse cliente. Conecte e sincronize um Google Forms
        em "Integrações" pra começar.
      </p>
    )
  }

  const wordFrequency = extractWordFrequency(answers ?? [])

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="text-base font-medium">Palavras mais frequentes nas respostas abertas</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <OptionBreakdownBarChart
            data={wordFrequency.map((w) => ({ label: w.word, count: w.count, percentage: w.percentage }))}
          />
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3 p-0">
          <CardTitle className="text-base font-medium">Sugestões de headlines e textos</CardTitle>
          <Button type="button" size="sm" disabled={generating} onClick={handleGenerate}>
            <Sparkles className={`h-3.5 w-3.5 ${generating ? 'animate-pulse' : ''}`} />
            {generating ? 'Gerando...' : 'Gerar sugestões com IA'}
          </Button>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          {!suggestions && (
            <p className="text-sm text-muted-foreground">
              Clique em "Gerar sugestões com IA" pra pedir pra Cassie sugerir headlines e textos de anúncio com base na
              linguagem real dessas respostas.
            </p>
          )}
          {suggestions && <p className="whitespace-pre-wrap text-sm text-foreground">{suggestions}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
