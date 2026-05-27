import type { BookingData } from '#/lib/zapier'
import type { BookingPrefill } from '#/lib/claude'
import { BookingForm } from './BookingForm'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  showBookingForm?: boolean
  bookingPrefill?: BookingPrefill
  bookingResult?: {
    status: 'confirmed' | 'unavailable' | 'error'
    message?: string
    bookingId?: string
  }
}

interface Props {
  message: Message
  onBookingSubmit: (data: BookingData) => void
  onBookingCancel: () => void
  isBookingLoading: boolean
}

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
}

export function ChatMessage({ message, onBookingSubmit, onBookingCancel, isBookingLoading }: Props) {
  const isUser = message.role === 'user'

  if (message.bookingResult) {
    const { status, message: msg, bookingId } = message.bookingResult
    const isConfirmed = status === 'confirmed'
    return (
      <div className="flex justify-start mb-3">
        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isConfirmed
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="font-semibold mb-1">
            {isConfirmed ? '✅ ¡Reservación Confirmada!' : '❌ No Disponible'}
          </p>
          {bookingId && <p className="text-xs opacity-70 mb-1">ID: {bookingId}</p>}
          <p>{msg}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-[85%]">
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <span className="text-xs text-slate-400 font-medium">Azul</span>
          </div>
        )}
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
        }`}>
          <span dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }} />
        </div>
        {message.showBookingForm && (
          <BookingForm
            prefill={message.bookingPrefill}
            onSubmit={onBookingSubmit}
            onCancel={onBookingCancel}
            isLoading={isBookingLoading}
          />
        )}
      </div>
    </div>
  )
}
