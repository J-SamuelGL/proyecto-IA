import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendToZapier, type BookingData } from '../../src/lib/zapier'

const BASE_DATA: BookingData = {
  name: 'Ana López',
  email: 'ana@example.com',
  phone: '50299887766',
  checkIn: '2026-06-10T15:00:00-06:00',
  checkOut: '2026-06-12T12:00:00-06:00',
  roomType: 'SVM',
  guests: 2,
}

describe('sendToZapier — mock mode (no ZAPIER_WEBHOOK_URL)', () => {
  it('returns confirmed for a Wednesday check-in', async () => {
    const result = await sendToZapier(BASE_DATA)
    expect(result.status).toBe('confirmed')
    expect(result.bookingId).toMatch(/^AH-\d+$/)
  })

  it('returns unavailable for a Friday check-in', async () => {
    // 2026-06-12 is a Friday
    const result = await sendToZapier({ ...BASE_DATA, checkIn: '2026-06-12T15:00:00-06:00', checkOut: '2026-06-14T12:00:00-06:00' })
    expect(result.status).toBe('unavailable')
    expect(result.message).toBeDefined()
  })

  it('includes the email in the confirmed message', async () => {
    const result = await sendToZapier(BASE_DATA)
    expect(result.message).toContain('ana@example.com')
  })
})

describe('sendToZapier — live mode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.ZAPIER_WEBHOOK_URL
  })

  it('POSTs to the webhook URL with JSON body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'confirmed', bookingId: 'AH-TEST-001' }),
    })
    vi.stubGlobal('fetch', mockFetch)
    process.env.ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/test/123/'

    const result = await sendToZapier(BASE_DATA)

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://hooks.zapier.com/hooks/catch/test/123/')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body as string)).toMatchObject({ name: 'Ana López' })
    expect(result.status).toBe('confirmed')
  })

  it('throws when webhook returns non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    process.env.ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/test'
    await expect(sendToZapier(BASE_DATA)).rejects.toThrow('Zapier returned 500')
  })
})
