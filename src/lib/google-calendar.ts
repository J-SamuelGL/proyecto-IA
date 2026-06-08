import { google } from 'googleapis'

export type RoomType = 'SVM' | 'SFM' | 'SP'

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY no está configurado')

  const credentials = JSON.parse(raw)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

// Columnas en Sheets (0-based): E=4 check_in, F=5 check_out, G=6 room_type, I=8 status
export async function isRoomAvailable(
  roomType: RoomType,
  checkIn: string,
  checkOut: string,
): Promise<boolean> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID
  if (!sheetsId) throw new Error('GOOGLE_SHEETS_ID no está configurado')

  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetsId,
    range: 'A:I',
  })

  const rows = res.data.values ?? []
  const newCheckIn = new Date(checkIn)
  const newCheckOut = new Date(checkOut)

  // Ignorar fila de encabezado (índice 0)
  const conflict = rows.slice(1).some((row) => {
    const status = row[8]
    const type = row[6]
    if (status !== 'confirmed' || type !== roomType) return false

    // Sheets guarda fechas como "YYYY-MM-DD HH:MM:SS" en hora Guatemala
    const existingIn = new Date(row[4]?.replace(' ', 'T') + '-06:00')
    const existingOut = new Date(row[5]?.replace(' ', 'T') + '-06:00')

    return existingIn < newCheckOut && existingOut > newCheckIn
  })

  return !conflict
}

export async function cancelBooking(bookingId: string): Promise<'cancelled' | 'not_found'> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID
  if (!sheetsId) throw new Error('GOOGLE_SHEETS_ID no está configurado')

  const sheets = getSheetsClient()

  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetsId })
  const sheetId = meta.data.sheets?.[0]?.properties?.sheetId ?? 0

  const sheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetsId,
    range: 'A:A',
  })

  const rows = sheetRes.data.values ?? []
  const rowIndex = rows.findIndex((row) => row[0] === bookingId)

  if (rowIndex === -1) return 'not_found'

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetsId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }],
    },
  })

  return 'cancelled'
}

export function isGoogleCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY &&
    process.env.GOOGLE_SHEETS_ID
  )
}
