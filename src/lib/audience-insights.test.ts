import { describe, expect, it } from 'vitest'
import { aggregateAudienceInsights, type AudienceRawQuestion, type AudienceRawResponse } from '@/lib/audience-insights'

const CONNECTION_A = 'connection-a'
const CONNECTION_B = 'connection-b'

function makeQuestion(overrides: Partial<AudienceRawQuestion> = {}): AudienceRawQuestion {
  return {
    id: crypto.randomUUID(),
    connection_id: CONNECTION_A,
    external_question_id: 'q1',
    title: 'Pergunta',
    question_type: 'choice_radio',
    ...overrides,
  }
}

function makeResponse(
  connectionId: string,
  answers: Array<{ external_question_id: string; answer_values: string[] | null; answer_text?: string | null }>,
): AudienceRawResponse {
  return {
    id: crypto.randomUUID(),
    connection_id: connectionId,
    form_answers: answers.map((a) => ({ answer_text: a.answer_text ?? null, ...a })),
  }
}

describe('aggregateAudienceInsights', () => {
  it('pergunta sem nenhuma resposta: 0 respondentes, sem opções', () => {
    const questions = [makeQuestion({ external_question_id: 'q1', title: 'Onde você nos achou?' })]
    const result = aggregateAudienceInsights(questions, [])

    expect(result).toHaveLength(1)
    expect(result[0].totalRespondents).toBe(0)
    expect(result[0].options).toEqual([])
  })

  it('pergunta de escolha única: % soma 100%, ordenada da mais votada pra menos votada', () => {
    const questions = [makeQuestion({ external_question_id: 'q1', title: 'Onde você nos achou?' })]
    const responses = [
      makeResponse(CONNECTION_A, [{ external_question_id: 'q1', answer_values: ['Instagram'] }]),
      makeResponse(CONNECTION_A, [{ external_question_id: 'q1', answer_values: ['Instagram'] }]),
      makeResponse(CONNECTION_A, [{ external_question_id: 'q1', answer_values: ['Google'] }]),
      makeResponse(CONNECTION_A, [{ external_question_id: 'q1', answer_values: ['Instagram'] }]),
    ]
    const [result] = aggregateAudienceInsights(questions, responses)

    expect(result.totalRespondents).toBe(4)
    expect(result.options).toEqual([
      { label: 'Instagram', count: 3, percentage: 75 },
      { label: 'Google', count: 1, percentage: 25 },
    ])
  })

  it('pergunta de caixa de seleção: uma resposta conta em mais de uma opção, % pode somar mais de 100%', () => {
    const questions = [makeQuestion({ external_question_id: 'q2', title: 'Onde mais você pesquisou?', question_type: 'choice_checkbox' })]
    const responses = [
      makeResponse(CONNECTION_A, [{ external_question_id: 'q2', answer_values: ['Site', 'Google'] }]),
      makeResponse(CONNECTION_A, [{ external_question_id: 'q2', answer_values: ['Site'] }]),
    ]
    const [result] = aggregateAudienceInsights(questions, responses)

    expect(result.totalRespondents).toBe(2) // 2 respostas distintas, não 3 seleções
    expect(result.options).toEqual([
      { label: 'Site', count: 2, percentage: 100 },
      { label: 'Google', count: 1, percentage: 50 },
    ])
  })

  it('resposta sem answer_values usa answer_text como opção única', () => {
    const questions = [makeQuestion({ external_question_id: 'q1' })]
    const responses = [makeResponse(CONNECTION_A, [{ external_question_id: 'q1', answer_values: null, answer_text: 'Facebook' }])]
    const [result] = aggregateAudienceInsights(questions, responses)

    expect(result.options).toEqual([{ label: 'Facebook', count: 1, percentage: 100 }])
  })

  it('resposta sem valor nenhum (answer_values e answer_text ambos vazios) não conta como respondente', () => {
    const questions = [makeQuestion({ external_question_id: 'q1' })]
    const responses = [makeResponse(CONNECTION_A, [{ external_question_id: 'q1', answer_values: null, answer_text: null }])]
    const [result] = aggregateAudienceInsights(questions, responses)

    expect(result.totalRespondents).toBe(0)
  })

  it('mesmo external_question_id em duas conexões diferentes do mesmo cliente não se mistura', () => {
    const questions = [
      makeQuestion({ id: 'question-a', connection_id: CONNECTION_A, external_question_id: 'q1', title: 'Formulário A' }),
      makeQuestion({ id: 'question-b', connection_id: CONNECTION_B, external_question_id: 'q1', title: 'Formulário B' }),
    ]
    const responses = [
      makeResponse(CONNECTION_A, [{ external_question_id: 'q1', answer_values: ['Opção A'] }]),
      makeResponse(CONNECTION_B, [{ external_question_id: 'q1', answer_values: ['Opção B'] }]),
    ]
    const result = aggregateAudienceInsights(questions, responses)

    const questionA = result.find((r) => r.questionId === 'question-a')!
    const questionB = result.find((r) => r.questionId === 'question-b')!
    expect(questionA.options).toEqual([{ label: 'Opção A', count: 1, percentage: 100 }])
    expect(questionB.options).toEqual([{ label: 'Opção B', count: 1, percentage: 100 }])
  })

  it('múltiplas perguntas de vários formulários do mesmo cliente aparecem todas juntas, sem limite fixo', () => {
    const questions = Array.from({ length: 5 }, (_, i) =>
      makeQuestion({ id: `q-${i}`, external_question_id: `ext-${i}`, title: `Pergunta ${i}` }),
    )
    const result = aggregateAudienceInsights(questions, [])

    expect(result).toHaveLength(5)
  })
})
