'use client'
import { useState, useRef, useEffect } from 'react'
import type { BookingData } from '#/lib/zapier'
import type { ChatMessage as ChatMessageType } from '#/lib/claude'
import { chatServerFn } from '#/lib/server/chatFn'
import { bookServerFn } from '#/lib/server/bookFn'
import { ChatMessage, type Message } from './ChatMessage'

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Bienvenido al **Azul Horizonte Boutique Hotel**! 🌊 Soy Azul, tu asistente virtual.\n\nEstamos en Playa Champerico, Guatemala, frente al Océano Pacífico. ¿En qué puedo ayudarte hoy?',
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isBookingLoading, setIsBookingLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const conversationHistory: ChatMessageType[] = messages
    .filter((m) => !m.showBookingForm && !m.bookingResult)
    .map((m) => ({ role: m.role, content: m.content }))

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || isChatLoading) return

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setIsChatLoading(true)

    try {
      const data = await chatServerFn({ data: { messages: conversationHistory, userMessage: trimmed } })
      setMessages((prev) => {
        const next = [...prev]
        if (data.checkingText) {
          next.push({ id: `a-check-${Date.now()}`, role: 'assistant', content: data.checkingText })
        }
        next.push({
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.text || '',
          showBookingForm: data.showBookingForm ?? false,
          bookingPrefill: data.bookingPrefill,
        })
        return next
      })
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Lo siento, hubo un problema de conexión. Por favor intenta de nuevo. 🙏',
        },
      ])
    } finally {
      setIsChatLoading(false)
    }
  }

  async function handleBookingSubmit(formData: BookingData) {
    setIsBookingLoading(true)
    try {
      const result = await bookServerFn({ data: formData })
      setMessages((prev) =>
        prev.map((m) => (m.showBookingForm ? { ...m, showBookingForm: false } : m)),
      )
      setMessages((prev) => [
        ...prev,
        {
          id: `booking-${Date.now()}`,
          role: 'assistant',
          content: '',
          bookingResult: result,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev.map((m) => (m.showBookingForm ? { ...m, showBookingForm: false } : m)),
        {
          id: `err-booking-${Date.now()}`,
          role: 'assistant',
          content: 'Hubo un error al procesar tu reservación. Por favor intenta de nuevo.',
        },
      ])
    } finally {
      setIsBookingLoading(false)
    }
  }

  function handleBookingCancel() {
    setMessages((prev) =>
      prev.map((m) => (m.showBookingForm ? { ...m, showBookingForm: false } : m)),
    )
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
          aria-label="Abrir asistente virtual"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Azul — Asistente Virtual</p>
                <p className="text-white/70 text-xs">Azul Horizonte Boutique Hotel</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white" aria-label="Cerrar chat">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onBookingSubmit={handleBookingSubmit}
                onBookingCancel={handleBookingCancel}
                isBookingLoading={isBookingLoading}
              />
            ))}
            {isChatLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-slate-100">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Escribe tu mensaje..."
                disabled={isChatLoading}
                className="flex-1 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 resize-none overflow-y-auto leading-snug"
              />
              <button
                onClick={sendMessage}
                disabled={isChatLoading || !input.trim()}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 rounded-full flex items-center justify-center transition-colors"
                aria-label="Enviar mensaje"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
