import { google } from 'googleapis'
import { readFileSync } from 'node:fs'

// Carga .env manualmente
const env = readFileSync('.env', 'utf-8')
for (const line of env.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
}

const ROOM_TYPE = 'SVM'
const CHECK_IN  = '2026-06-10T15:00:00-06:00'
const CHECK_OUT = '2026-06-11T12:00:00-06:00'

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
})
const calendar = google.calendar({ version: 'v3', auth })
const calendarId = process.env.GOOGLE_CALENDAR_HOTEL

console.log('=== Parámetros de búsqueda ===')
console.log('roomType :', ROOM_TYPE)
console.log('checkIn  :', CHECK_IN)
console.log('checkOut :', CHECK_OUT)
console.log('calendarId:', calendarId)
console.log()

// --- Test 1: con q (comportamiento anterior) ---
console.log('--- Test 1: con q:"SVM" ---')
const res1 = await calendar.events.list({
  calendarId,
  timeMin: CHECK_IN,
  timeMax: CHECK_OUT,
  q: ROOM_TYPE,
  singleEvents: true,
  maxResults: 10,
})
const items1 = res1.data.items ?? []
console.log(`Eventos encontrados: ${items1.length}`)
items1.forEach(e => console.log(' -', e.summary, '|', e.start?.dateTime, '→', e.end?.dateTime))
console.log('Resultado isRoomAvailable (viejo):', items1.length === 0 ? 'DISPONIBLE ✅' : 'OCUPADO ❌')
console.log()

// --- Test 2: sin q, filtro en código (comportamiento nuevo) ---
console.log('--- Test 2: sin q, filtro .includes("SVM") ---')
const res2 = await calendar.events.list({
  calendarId,
  timeMin: CHECK_IN,
  timeMax: CHECK_OUT,
  singleEvents: true,
  maxResults: 50,
})
const items2 = res2.data.items ?? []
console.log(`Eventos en el rango (todos): ${items2.length}`)
items2.forEach(e => console.log(' -', e.summary, '|', e.start?.dateTime, '→', e.end?.dateTime))
const overlapping = items2.filter(e => e.summary?.includes(ROOM_TYPE))
console.log(`Eventos que incluyen "${ROOM_TYPE}": ${overlapping.length}`)
console.log('Resultado isRoomAvailable (nuevo):', overlapping.length === 0 ? 'DISPONIBLE ✅' : 'OCUPADO ❌')
