import { google } from 'googleapis'
import { readFileSync } from 'fs'

const env = readFileSync('.env', 'utf8')
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim()
}

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const sheetsId = process.env.GOOGLE_SHEETS_ID
const BOOKING_ID = '2bn4t19176ahcmrr2n0qq84e5o'

const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetsId })
const sheetId = meta.data.sheets?.[0]?.properties?.sheetId ?? 0
console.log('sheetId real:', sheetId)

const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetsId, range: 'A:A' })
const rows = res.data.values ?? []
const rowIndex = rows.findIndex((row) => row[0] === BOOKING_ID)
console.log('rowIndex:', rowIndex)

if (rowIndex === -1) { console.log('❌ No encontrado'); process.exit(1) }

await sheets.spreadsheets.batchUpdate({
  spreadsheetId: sheetsId,
  requestBody: {
    requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 } } }],
  },
})
console.log('✅ Fila eliminada exitosamente')
