import { createServerFn } from '@tanstack/react-start'
import { chat, type ChatMessage, type ChatResponse } from '../claude'

interface ChatInput {
  messages: ChatMessage[]
  userMessage: string
}

export const chatServerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ChatInput): ChatInput => data)
  .handler(async ({ data }): Promise<ChatResponse> => {
    try {
      return await chat(data.messages ?? [], data.userMessage.trim())
    } catch (error) {
      console.error('[chatServerFn]', error)
      return {
        text: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        showBookingForm: false,
      }
    }
  })
