import { createServerFn } from '@tanstack/react-start'
import { sendToZapier, type BookingData, type BookingResult } from '../zapier'
import { isRoomAvailable, isGoogleCalendarConfigured } from '../google-calendar'

const REQUIRED: (keyof BookingData)[] = [
  'name', 'email', 'phone', 'checkIn', 'checkOut', 'roomType', 'guests',
]

export const bookServerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: BookingData): BookingData => data)
  .handler(async ({ data }): Promise<BookingResult> => {
    const missing = REQUIRED.filter((f) => !data[f])
    if (missing.length > 0) {
      return {
        status: 'unavailable',
        message: `Faltan campos requeridos: ${missing.join(', ')}`,
      }
    }

    // Verificar disponibilidad en Google Calendar antes de llamar Zapier
    if (isGoogleCalendarConfigured()) {
      try {
        const available = await isRoomAvailable(data.roomType, data.checkIn, data.checkOut)
        if (!available) {
          return {
            status: 'unavailable',
            message: 'Las fechas seleccionadas no están disponibles para esa habitación. Por favor elige otras fechas.',
          }
        }
      } catch (error) {
        console.error('[bookServerFn] Error verificando disponibilidad en Calendar:', error)
        return {
          status: 'unavailable',
          message: 'No fue posible verificar disponibilidad en este momento. Intenta de nuevo.',
        }
      }
    }

    try {
      return await sendToZapier(data)
    } catch (error) {
      console.error('[bookServerFn]', error)
      return {
        status: 'unavailable',
        message: 'Error al procesar la reservación. Por favor intenta de nuevo en unos minutos.',
      }
    }
  })
