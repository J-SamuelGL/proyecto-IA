import { google } from 'googleapis'

export type RoomType = 'SVM' | 'SFM' | 'SP'

function getClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY no está configurado')

  const credentials = JSON.parse(raw)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  })
  return google.calendar({ version: 'v3', auth })
}

/**
 * Verifica si una habitación está disponible en el rango de fechas dado.
 * Devuelve true si NO hay eventos que se traslapen con [checkIn, checkOut].
 * checkIn y checkOut deben ser ISO 8601 con offset de Guatemala, ej: "2026-06-10T15:00:00-06:00"
 * roomType se usa para buscar eventos con ese texto en el título (ej: "SVM").
 */
export async function isRoomAvailable(
  roomType: RoomType,
  checkIn: string,
  checkOut: string,
): Promise<boolean> {
  const calendarId = process.env.GOOGLE_CALENDAR_HOTEL
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_HOTEL no está configurado')

  const calendar = getClient()

  const res = await calendar.events.list({
    calendarId,
    timeMin: checkIn,
    timeMax: checkOut,
    singleEvents: true,
    maxResults: 50,
  })

  const overlapping = (res.data.items ?? []).filter((event) =>
    event.summary?.includes(roomType),
  )

  return overlapping.length === 0
}

export function isGoogleCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY &&
    process.env.GOOGLE_CALENDAR_HOTEL
  )
}
