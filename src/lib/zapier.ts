export interface BookingData {
  bookingId: string  // UUID generado por el backend antes de llamar Zapier
  name: string
  email: string
  phone: string
  checkIn: string   // ISO 8601 con offset Guatemala, ej: "2026-06-10T15:00:00-06:00"
  checkOut: string  // ISO 8601 con offset Guatemala, ej: "2026-06-12T12:00:00-06:00"
  roomType: 'SVM' | 'SFM' | 'SP'
  guests: number
}

export interface BookingResult {
  status: 'confirmed' | 'unavailable'
  bookingId?: string
  message?: string
}

export async function sendToZapier(data: BookingData): Promise<BookingResult> {
  if (!process.env.ZAPIER_WEBHOOK_URL) {
    return getMockBookingResult(data)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(process.env.ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Zapier returned ${response.status}`)
    }

    return {
      status: 'confirmed',
      bookingId: data.bookingId,
      message: `¡Reservación confirmada! Recibirás un correo de confirmación en ${data.email} en los próximos minutos.`,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

function getMockBookingResult(data: BookingData): BookingResult {
  // Fridays simulate unavailability for demo purposes
  const checkIn = new Date(data.checkIn)
  if (checkIn.getUTCDay() === 5) {
    return {
      status: 'unavailable',
      message:
        'Las fechas seleccionadas no están disponibles para esa habitación. Por favor elige otras fechas o un tipo de suite diferente.',
    }
  }

  return {
    status: 'confirmed',
    bookingId: data.bookingId,
    message: `¡Reservación confirmada! Recibirás un correo de confirmación en ${data.email} en los próximos minutos.`,
  }
}
