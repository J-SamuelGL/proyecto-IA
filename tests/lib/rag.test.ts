import { describe, it, expect } from 'vitest'
import { retrieveContext } from '../../src/lib/rag'

describe('retrieveContext', () => {
  it('returns a non-empty string for any query', () => {
    const result = retrieveContext('hola')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns room info when queried about habitaciones', () => {
    const result = retrieveContext('cuánto cuesta la habitación suite precio')
    expect(result.toLowerCase()).toContain('suite')
  })

  it('returns policy info when queried about cancelación', () => {
    const result = retrieveContext('cancelación política reembolso')
    expect(result.toLowerCase()).toContain('cancelaci')
  })

  it('returns services info when queried about tours', () => {
    const result = retrieveContext('tour kayak pesca actividades')
    expect(result.toLowerCase()).toContain('tour')
  })

  it('returns all knowledge when no keywords match (at least 200 chars)', () => {
    const result = retrieveContext('xyzxyzxyz')
    expect(result.length).toBeGreaterThan(200)
  })

  it('does not exceed 4000 characters', () => {
    const result = retrieveContext('hotel información general todo')
    expect(result.length).toBeLessThan(4000)
  })
})
