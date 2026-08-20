import { describe, expect, it } from 'vitest'
import { extractWordFrequency } from '@/lib/word-frequency'

describe('extractWordFrequency', () => {
  it('lista vazia devolve resultado vazio', () => {
    expect(extractWordFrequency([])).toEqual([])
  })

  it('conta palavras em comum entre respostas, ordenado da mais pra menos frequente', () => {
    const result = extractWordFrequency(['O preço está caro demais', 'O preço não cabe no orçamento', 'Achei o preço justo'])

    expect(result[0]).toEqual({ word: 'preço', count: 3, percentage: 100 })
  })

  it('remove stopwords comuns do português', () => {
    const result = extractWordFrequency(['Isso é muito bom para mim', 'Isso é muito bom para nós também'])
    const words = result.map((r) => r.word)

    expect(words).not.toContain('isso')
    expect(words).not.toContain('muito')
    expect(words).not.toContain('para')
    expect(words).toContain('bom')
  })

  it('ignora maiúsculo/minúsculo e pontuação', () => {
    const result = extractWordFrequency(['Atendimento excelente!', 'atendimento, muito bom.'])

    expect(result.find((r) => r.word === 'atendimento')?.count).toBe(2)
  })

  it('uma palavra repetida na mesma resposta conta só 1 vez (percentage = % de respostas, não de ocorrências)', () => {
    const result = extractWordFrequency(['preço preço preço caro', 'atendimento bom'])

    expect(result.find((r) => r.word === 'preço')).toEqual({ word: 'preço', count: 1, percentage: 50 })
  })

  it('topN limita o tamanho do resultado', () => {
    const answers = ['alfa beta gama delta epsilon zeta eta theta']
    const result = extractWordFrequency(answers, 3)

    expect(result).toHaveLength(3)
  })

  it('ignora palavras com menos de 3 letras', () => {
    const result = extractWordFrequency(['eu vi um ovo lá', 'atendimento bom'])
    const words = result.map((r) => r.word)

    expect(words).not.toContain('vi')
    expect(words).not.toContain('lá')
  })
})
