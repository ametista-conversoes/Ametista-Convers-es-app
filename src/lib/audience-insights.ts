export interface AudienceOptionBreakdown {
  label: string
  count: number
  percentage: number
}

export interface AudienceQuestionInsight {
  questionId: string
  title: string
  questionType: string
  totalRespondents: number
  options: AudienceOptionBreakdown[]
}

export interface AudienceRawQuestion {
  id: string
  connection_id: string
  external_question_id: string
  title: string
  question_type: string
}

export interface AudienceRawAnswer {
  external_question_id: string
  answer_text: string | null
  answer_values: string[] | null
}

export interface AudienceRawResponse {
  id: string
  connection_id: string
  form_answers: AudienceRawAnswer[]
}

/**
 * Síntese em % das perguntas fechadas (Fase 8.3, "Públicos-Alvo") —
 * função pura pra dar pra testar sem precisar de Supabase. Chave =
 * `${connection_id}|${external_question_id}` (evita colisão caso dois
 * formulários diferentes do mesmo cliente tenham, por coincidência, o
 * mesmo id de pergunta). Uma resposta de caixa de seleção conta em
 * mais de uma opção — por isso os % de uma pergunta desse tipo podem
 * somar mais de 100%, é o comportamento esperado.
 */
export function aggregateAudienceInsights(
  questions: AudienceRawQuestion[],
  responses: AudienceRawResponse[],
): AudienceQuestionInsight[] {
  const respondentSets = new Map<string, Set<string>>()
  const optionCounts = new Map<string, Map<string, number>>()

  for (const response of responses) {
    for (const answer of response.form_answers) {
      const values = answer.answer_values ?? (answer.answer_text ? [answer.answer_text] : [])
      if (values.length === 0) continue

      const key = `${response.connection_id}|${answer.external_question_id}`
      if (!respondentSets.has(key)) respondentSets.set(key, new Set())
      respondentSets.get(key)!.add(response.id)

      if (!optionCounts.has(key)) optionCounts.set(key, new Map())
      const counts = optionCounts.get(key)!
      for (const value of values) {
        counts.set(value, (counts.get(value) ?? 0) + 1)
      }
    }
  }

  return questions.map((question) => {
    const key = `${question.connection_id}|${question.external_question_id}`
    const totalRespondents = respondentSets.get(key)?.size ?? 0
    const counts = optionCounts.get(key) ?? new Map<string, number>()
    const options: AudienceOptionBreakdown[] = Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: totalRespondents > 0 ? (count / totalRespondents) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      questionId: question.id,
      title: question.title,
      questionType: question.question_type,
      totalRespondents,
      options,
    }
  })
}
