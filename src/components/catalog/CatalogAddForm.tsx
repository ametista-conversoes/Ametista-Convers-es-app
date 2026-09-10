import { useState } from 'react'
import { ClipboardPaste, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateCatalogEntries,
  useCreateCatalogEntry,
  type CatalogEntryOrigem,
  type CatalogEntryPrioridade,
  type CatalogEntryRecord,
  type CatalogEntryTipo,
  type CatalogType,
} from '@/hooks/useManagerPortalData'
import {
  CATALOG_NONE_VALUE,
  CATALOG_PRIORIDADE_OPTIONS,
  CATALOG_TIPO_MAX_LENGTH,
  CATALOG_TIPO_OPTIONS,
  CATALOG_TIPO_PLACEHOLDERS,
  truncateCatalogText,
} from '@/lib/catalog'
import { catalogEntryPrioridadeLabels, catalogEntryTipoLabels } from '@/lib/status-styles'
import { cn } from '@/lib/utils'

const SEGMENTACAO_PLACEHOLDER = 'Descreva a segmentação (interesses, público personalizado, lookalike 1%...)'

interface CatalogAddFormProps {
  clientId: string
  catalogType: CatalogType
  /** Entradas já existentes desse cliente/tipo — alimenta o "Variação
   * de" (só faz sentido no modo de uma entrada por vez). */
  entries: CatalogEntryRecord[]
}

/** Formulário de criação de entrada do catálogo — extraído do
 * CatalogCard (Fase 34) pra ser reaproveitado também na página global
 * "Catálogo" (Fase 34c, que antes só lia/editava/apagava, sem criar).
 * Ganhou o modo "Colar em massa": cada linha colada na textarea vira
 * uma entrada separada — nunca uma headline partida em duas linhas,
 * nunca duas headlines na mesma linha — pra cadastrar headlines e
 * descrições em lote em vez de uma de cada vez. */
export function CatalogAddForm({ clientId, catalogType, entries }: CatalogAddFormProps) {
  const createEntry = useCreateCatalogEntry()
  const createEntries = useCreateCatalogEntries()

  const [adding, setAdding] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [tipo, setTipo] = useState<CatalogEntryTipo>('headline')
  const [conteudo, setConteudo] = useState('')
  const [bulkConteudo, setBulkConteudo] = useState('')
  const [origem, setOrigem] = useState<CatalogEntryOrigem>('manual')
  const [prioridade, setPrioridade] = useState<CatalogEntryPrioridade>('media')
  const [derivadoDe, setDerivadoDe] = useState(CATALOG_NONE_VALUE)

  function reset() {
    setConteudo('')
    setBulkConteudo('')
    setTipo('headline')
    setOrigem('manual')
    setPrioridade('media')
    setDerivadoDe(CATALOG_NONE_VALUE)
    setBulkMode(false)
    setAdding(false)
  }

  // Headline (15 caracteres) e Descrição (90) são obrigatórios pro
  // formato de anúncio de texto — Frase de destaque e Vídeo, e
  // Segmentações, não têm limite.
  const maxLength = catalogType === 'criativo' ? CATALOG_TIPO_MAX_LENGTH[tipo] : undefined
  const overLimit = maxLength != null && conteudo.trim().length > maxLength

  async function handleAdd() {
    if (!conteudo.trim() || overLimit) return
    try {
      await createEntry.mutateAsync({
        client_id: clientId,
        catalog_type: catalogType,
        tipo: catalogType === 'criativo' ? tipo : null,
        conteudo: conteudo.trim(),
        origem,
        prioridade,
        derivado_de: derivadoDe === CATALOG_NONE_VALUE ? null : derivadoDe,
      })
      reset()
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  // Nunca uma headline em duas linhas, nunca duas headlines na mesma
  // linha: 1 linha colada = 1 entrada, sempre.
  const bulkLines = bulkConteudo
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  const bulkLinesOverLimit = maxLength != null ? bulkLines.filter((line) => line.length > maxLength) : []

  async function handleBulkAdd() {
    if (bulkLines.length === 0 || bulkLinesOverLimit.length > 0) return
    try {
      await createEntries.mutateAsync(
        bulkLines.map((line) => ({
          client_id: clientId,
          catalog_type: catalogType,
          tipo: catalogType === 'criativo' ? tipo : null,
          conteudo: line,
          origem,
          prioridade,
          derivado_de: null,
        })),
      )
      reset()
    } catch {
      // erro já avisado pelo onError do hook
    }
  }

  if (!adding) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
        <Plus className="h-3.5 w-3.5" />
        Adicionar
      </Button>
    )
  }

  return (
    <div className="space-y-2 rounded-lg bg-secondary/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {catalogType === 'criativo' && (
          <Select value={tipo} onValueChange={(value) => setTipo(value as CatalogEntryTipo)}>
            <SelectTrigger className="h-8 w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATALOG_TIPO_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {catalogEntryTipoLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-7 text-xs text-muted-foreground"
          onClick={() => setBulkMode((v) => !v)}
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          {bulkMode ? 'Uma entrada por vez' : 'Colar várias em massa'}
        </Button>
      </div>

      {bulkMode ? (
        <div className="space-y-1">
          <Textarea
            placeholder={
              'Uma por linha — cada linha vira uma entrada separada.\nEx:\nTransforme seu negócio hoje mesmo\nVenda mais todos os dias\nAumente seus resultados agora'
            }
            value={bulkConteudo}
            onChange={(e) => setBulkConteudo(e.target.value)}
            className="min-h-[120px] text-sm"
          />
          {maxLength != null && (
            <p className={cn('text-[11px]', bulkLinesOverLimit.length > 0 ? 'text-destructive' : 'text-muted-foreground')}>
              Limite de {maxLength} caracteres por linha ({catalogEntryTipoLabels[tipo]})
              {bulkLinesOverLimit.length > 0
                ? ` — ${bulkLinesOverLimit.length} linha${bulkLinesOverLimit.length === 1 ? '' : 's'} passou do limite.`
                : '.'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <Textarea
            placeholder={catalogType === 'criativo' ? CATALOG_TIPO_PLACEHOLDERS[tipo] : SEGMENTACAO_PLACEHOLDER}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            className="text-sm"
          />
          {maxLength != null && (
            <p className={cn('text-right text-[11px]', overLimit ? 'text-destructive' : 'text-muted-foreground')}>
              {conteudo.trim().length}/{maxLength} caracteres
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Select value={origem} onValueChange={(value) => setOrigem(value as CatalogEntryOrigem)}>
          <SelectTrigger className="h-8 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ia">IA (Cassie)</SelectItem>
            <SelectItem value="forms">Forms</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={prioridade} onValueChange={(value) => setPrioridade(value as CatalogEntryPrioridade)}>
          <SelectTrigger className="h-8 w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATALOG_PRIORIDADE_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {catalogEntryPrioridadeLabels[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!bulkMode && entries.length > 0 && (
          <Select value={derivadoDe} onValueChange={setDerivadoDe}>
            <SelectTrigger className="h-8 w-full sm:w-56">
              <SelectValue placeholder="Variação de (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CATALOG_NONE_VALUE}>Não é variação de nada</SelectItem>
              {entries.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {truncateCatalogText(e.conteudo, 40)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2">
        {bulkMode ? (
          <Button
            type="button"
            size="sm"
            disabled={createEntries.isPending || bulkLines.length === 0 || bulkLinesOverLimit.length > 0}
            onClick={handleBulkAdd}
          >
            Criar {bulkLines.length} entrada{bulkLines.length === 1 ? '' : 's'}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={createEntry.isPending || !conteudo.trim() || overLimit}
            onClick={handleAdd}
          >
            Salvar
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={reset}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
