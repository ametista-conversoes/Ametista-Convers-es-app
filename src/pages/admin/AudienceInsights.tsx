import { useState } from 'react'
import { Search } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OptionBreakdownBarChart } from '@/components/charts/OptionBreakdownBarChart'
import { PersuasiveCopyPanel } from '@/components/audience/PersuasiveCopyPanel'
import {
  useAllClients,
  useAllDigitalAssets,
  useAudienceInsights,
  useDigitalAssetConnections,
} from '@/hooks/useManagerPortalData'

const ALL_FORMS = 'all'

/** "Públicos-Alvo" (Fase 8.3/8.3b/8.4). Duas abas, compartilhando o
 * mesmo seletor de Cliente/Formulário no cabeçalho: "Perguntas
 * Fechadas" (síntese em %, 100% dinâmica — a lista de perguntas/opções
 * vem inteira de `useAudienceInsights`, nada fixo por formulário
 * específico) e "Comunicação Persuasiva" (Fase 8.4 — palavras mais
 * frequentes das perguntas abertas + sugestões de headline/texto via
 * IA, em `PersuasiveCopyPanel`).
 *
 * Um cliente pode ter mais de um Google Forms conectado com propósitos
 * diferentes (formulário de cliente, de objeção, etc) — o seletor de
 * "Formulário" e o agrupamento por seção usam o nome do Ativo Digital
 * (`asset.name`) pra distinguir, reaproveitando os mesmos hooks já
 * usados em `Integrations.tsx` (não precisa de campo novo). */
export default function AudienceInsights() {
  const { data: clients } = useAllClients()
  const { data: assets } = useAllDigitalAssets()
  const { data: connections } = useDigitalAssetConnections()
  const [clientId, setClientId] = useState('')
  const [formFilter, setFormFilter] = useState(ALL_FORMS)
  const [search, setSearch] = useState('')
  const { data: insights, isLoading } = useAudienceInsights(clientId || null)

  const clientForms = (connections ?? [])
    .filter((connection) => connection.provider === 'google_forms')
    .map((connection) => {
      const asset = (assets ?? []).find((a) => a.id === connection.digital_asset_id)
      return asset && asset.client_id === clientId ? { connectionId: connection.id, label: asset.name } : null
    })
    .filter((form): form is { connectionId: string; label: string } => !!form)

  const term = search.trim().toLowerCase()
  const filteredInsights = (insights ?? []).filter(
    (question) =>
      (formFilter === ALL_FORMS || question.connectionId === formFilter) &&
      (!term || question.title.toLowerCase().includes(term)),
  )

  const showFormSelect = clientForms.length > 1
  const groupByForm = showFormSelect && formFilter === ALL_FORMS

  const groups = groupByForm
    ? clientForms
        .map((form) => ({ ...form, questions: filteredInsights.filter((q) => q.connectionId === form.connectionId) }))
        .filter((group) => group.questions.length > 0)
    : [{ connectionId: ALL_FORMS, label: '', questions: filteredInsights }]

  const formConnectionIds = formFilter === ALL_FORMS ? clientForms.map((form) => form.connectionId) : [formFilter]

  function renderQuestionCard(question: (typeof filteredInsights)[number]) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Públicos-Alvo</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {clientId && showFormSelect && (
            <Select value={formFilter} onValueChange={setFormFilter}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FORMS}>Todos os formulários</SelectItem>
                {clientForms.map((form) => (
                  <SelectItem key={form.connectionId} value={form.connectionId}>
                    {form.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={clientId}
            onValueChange={(value) => {
              setClientId(value)
              setFormFilter(ALL_FORMS)
              setSearch('')
            }}
          >
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
      </div>

      {!clientId && (
        <p className="text-sm text-muted-foreground">Escolha um cliente pra ver a síntese das respostas de formulário.</p>
      )}

      {clientId && (
        <Tabs defaultValue="closed">
          <TabsList>
            <TabsTrigger value="closed">Perguntas Fechadas</TabsTrigger>
            <TabsTrigger value="persuasive">Comunicação Persuasiva</TabsTrigger>
          </TabsList>

          <TabsContent value="closed" className="space-y-6">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar pergunta..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

            {!isLoading && (insights ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma pergunta fechada sincronizada ainda pra esse cliente. Conecte e sincronize um Google Forms em
                "Integrações" pra começar.
              </p>
            )}

            {!isLoading && (insights ?? []).length > 0 && filteredInsights.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma pergunta encontrada com esse filtro.</p>
            )}

            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.connectionId} className="space-y-4">
                  {groupByForm && <h2 className="text-sm font-medium text-muted-foreground">{group.label}</h2>}
                  <div className="space-y-4">{group.questions.map(renderQuestionCard)}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="persuasive">
            <PersuasiveCopyPanel
              clientId={clientId}
              connectionIds={formConnectionIds}
              connectionId={formFilter === ALL_FORMS ? undefined : formFilter}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
