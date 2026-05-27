import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, getMockResponse } from '../../src/lib/claude'

describe('buildSystemPrompt', () => {
  it('includes the hotel name', () => {
    const result = buildSystemPrompt('contexto de prueba')
    expect(result).toContain('Azul Horizonte')
  })

  it('includes Champerico location', () => {
    const result = buildSystemPrompt('')
    expect(result).toContain('Champerico')
  })

  it('includes the provided context', () => {
    const context = 'Suite Vista Mar Q950 por noche'
    const result = buildSystemPrompt(context)
    expect(result).toContain(context)
  })
})

describe('getMockResponse', () => {
  it('returns a placeholder text and showBookingForm=false', () => {
    const result = getMockResponse('cualquier mensaje')
    expect(result).toHaveProperty('text')
    expect(result).toHaveProperty('showBookingForm')
    expect(typeof result.text).toBe('string')
    expect(result.text.length).toBeGreaterThan(0)
    expect(result.showBookingForm).toBe(false)
  })
})
