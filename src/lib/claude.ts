import Anthropic from '@anthropic-ai/sdk'
import { retrieveContext } from './rag'
import { isRoomAvailable, isGoogleCalendarConfigured, type RoomType } from './google-calendar'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BookingPrefill {
  roomType: 'SVM' | 'SFM' | 'SP'
  checkIn: string
  checkOut: string
}

export interface ChatResponse {
  text: string
  checkingText?: string
  showBookingForm: boolean
  bookingPrefill?: BookingPrefill
}

interface CheckAvailabilityInput {
  roomType: RoomType
  checkIn: string
  checkOut: string
}

const ROOM_NAMES: Record<RoomType, string> = {
  SVM: 'Suite Vista Mar',
  SFM: 'Suite Frente al Mar',
  SP:  'Suite Presidencial',
}

const CHECK_AVAILABILITY_TOOL: Anthropic.Tool = {
  name: 'check_availability',
  description:
    'Verifica si una habitación está disponible para las fechas solicitadas. ' +
    'Úsalo cuando el cliente mencione fechas y tipo de habitación, ANTES de mostrar el formulario. ' +
    'Check-in siempre a las 15:00, check-out a las 12:00, timezone Guatemala (UTC-6).',
  input_schema: {
    type: 'object' as const,
    properties: {
      roomType: {
        type: 'string',
        enum: ['SVM', 'SFM', 'SP'],
        description: 'SVM = Suite Vista Mar | SFM = Suite Frente al Mar | SP = Suite Presidencial',
      },
      checkIn: {
        type: 'string',
        description: 'ISO 8601 con offset Guatemala, ej: 2026-06-10T15:00:00-06:00',
      },
      checkOut: {
        type: 'string',
        description: 'ISO 8601 con offset Guatemala, ej: 2026-06-12T12:00:00-06:00',
      },
    },
    required: ['roomType', 'checkIn', 'checkOut'],
  },
}

const SHOW_BOOKING_FORM_TOOL: Anthropic.Tool = {
  name: 'show_booking_form',
  description:
    'Muestra el formulario de reservación al cliente. ' +
    'Úsalo ÚNICAMENTE después de verificar disponibilidad con check_availability y confirmar que la habitación está libre, ' +
    'y cuando el cliente haya confirmado que desea proceder.',
  input_schema: {
    type: 'object' as const,
    properties: {
      roomType: {
        type: 'string',
        enum: ['SVM', 'SFM', 'SP'],
        description: 'Tipo de habitación confirmada',
      },
      checkIn: {
        type: 'string',
        description: 'ISO 8601 con offset Guatemala, ej: 2026-06-13T15:00:00-06:00',
      },
      checkOut: {
        type: 'string',
        description: 'ISO 8601 con offset Guatemala, ej: 2026-06-14T12:00:00-06:00',
      },
    },
    required: ['roomType', 'checkIn', 'checkOut'],
  },
}

export function buildSystemPrompt(context: string): string {
  return `Eres Azul, el asistente virtual del Azul Horizonte Boutique Hotel en Playa Champerico, Retalhuleu, Guatemala. Eres amable, profesional y conoces todos los detalles del hotel.

INFORMACIÓN DEL HOTEL:
${context}

INSTRUCCIONES:
- Saluda calurosamente en el primer mensaje con "¡Bienvenido al Azul Horizonte Boutique Hotel!"
- Responde preguntas sobre habitaciones, servicios, ubicación y políticas usando la información anterior
- Cuando el cliente mencione fechas y tipo de habitación, usa check_availability ANTES de mostrar el formulario
- Si la habitación no está disponible, informa al cliente y sugiere otras fechas u otro tipo de suite
- Si está disponible, confirma la disponibilidad y ofrece abrir el formulario de reservación
- Cuando el cliente confirme que desea reservar (y disponibilidad ya verificada), usa show_booking_form
- No inventes información que no esté en el contexto proporcionado
- Responde siempre en el idioma del cliente (español o inglés)
- Sé conciso: máximo 4 párrafos por respuesta
- No menciones que eres una IA a menos que te lo pregunten directamente`
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function chat(
  messages: ChatMessage[],
  userMessage: string,
): Promise<ChatResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockResponse(userMessage)
  }

  const context = retrieveContext(userMessage)
  const systemPrompt = buildSystemPrompt(context)

  let conversationMessages: Anthropic.MessageParam[] = [
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ]

  let text = ''
  let checkingText: string | undefined
  let showBookingForm = false
  let bookingPrefill: BookingPrefill | undefined

  // Loop agéntico: ejecuta tools del servidor y devuelve resultados a Claude
  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      tools: [CHECK_AVAILABILITY_TOOL, SHOW_BOOKING_FORM_TOOL],
      messages: conversationMessages,
    })

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    let turnText = ''
    let hasCheckAvailability = false

    for (const block of response.content) {
      if (block.type === 'text') {
        turnText += block.text
      }
      if (block.type === 'tool_use' && block.name === 'check_availability') {
        hasCheckAvailability = true
      }

      if (block.type === 'tool_use') {
        if (block.name === 'show_booking_form') {
          showBookingForm = true
          const input = block.input as { roomType?: string; checkIn?: string; checkOut?: string }
          if (input.roomType && input.checkIn && input.checkOut) {
            bookingPrefill = {
              roomType: input.roomType as BookingPrefill['roomType'],
              checkIn: input.checkIn,
              checkOut: input.checkOut,
            }
          }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: 'Formulario de reservación mostrado al usuario.',
          })
        }

        if (block.name === 'check_availability') {
          const input = block.input as CheckAvailabilityInput
          let available = true

          if (isGoogleCalendarConfigured()) {
            try {
              available = await isRoomAvailable(input.roomType, input.checkIn, input.checkOut)
            } catch (err) {
              console.error('[check_availability]', err)
              // En caso de error, asumimos disponible para no bloquear al usuario
            }
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: available
              ? `Disponible: la ${ROOM_NAMES[input.roomType]} está libre para esas fechas.`
              : `No disponible: la ${ROOM_NAMES[input.roomType]} ya tiene una reservación que se traslapa con esas fechas. Sugiere fechas alternativas o un tipo de suite diferente.`,
          })
        }
      }
    }

    // El texto del turno con check_availability va como mensaje "verificando..."
    // El texto de los demás turnos (incluida la respuesta final) se acumula en text
    if (hasCheckAvailability) {
      checkingText = turnText.trim() || undefined
    } else {
      text += turnText
    }

    // Sin tool calls o respuesta final: terminamos
    if (response.stop_reason === 'end_turn' || toolResults.length === 0) break

    // Si show_booking_form fue llamado no necesitamos más texto de Claude
    if (showBookingForm) break

    // Agrega respuesta del asistente + resultados de tools al historial y continúa
    conversationMessages = [
      ...conversationMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ]
  }

  return { text, checkingText, showBookingForm, bookingPrefill }
}

export function getMockResponse(_userMessage: string): ChatResponse {
  return {
    text: '[Modo demo] Configura ANTHROPIC_API_KEY en .env para activar el agente Azul.',
    showBookingForm: false,
  }
}
