import { describe, expect, it } from 'vitest'
import { getAllowedCassieModes } from '@/lib/cassie-modes'

describe('getAllowedCassieModes', () => {
  it('cliente no plano Validação só tem o modo Assistente', () => {
    expect(getAllowedCassieModes('cliente', 'validacao')).toEqual(['assistente'])
  })

  it('cliente no plano Escala tem Assistente + Analista', () => {
    expect(getAllowedCassieModes('cliente', 'escala')).toEqual(['assistente', 'analista'])
  })

  it('cliente no plano Dominação tem os 4 modos (Assistente, Analista, Consultora e Auditora)', () => {
    expect(getAllowedCassieModes('cliente', 'dominacao')).toEqual(['assistente', 'analista', 'consultora', 'auditora'])
  })

  it('cliente sem plano definido cai no padrão (só Assistente)', () => {
    expect(getAllowedCassieModes('cliente', null)).toEqual(['assistente'])
  })

  it('admin sempre vê os 4 modos, independente de plano', () => {
    expect(getAllowedCassieModes('admin', null)).toEqual(['assistente', 'analista', 'consultora', 'auditora'])
    expect(getAllowedCassieModes('admin', 'validacao')).toEqual(['assistente', 'analista', 'consultora', 'auditora'])
  })

  it('gestor sempre vê os 4 modos, independente de plano', () => {
    expect(getAllowedCassieModes('gestor', 'validacao')).toEqual(['assistente', 'analista', 'consultora', 'auditora'])
  })
})
