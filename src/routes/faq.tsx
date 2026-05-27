import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/faq')({
  component: FAQPage,
})

const FAQS = [
  { q: '¿Dónde está ubicado el hotel?', a: 'Estamos en Playa Champerico, Retalhuleu, Guatemala, en la costa del Océano Pacífico. Champerico es famosa por su arena negra volcánica y sus atardeceres únicos. Nos encontramos a 3 horas de Ciudad de Guatemala y 45 minutos de Retalhuleu.' },
  { q: '¿El desayuno está incluido en todas las habitaciones?', a: 'Sí, todas nuestras suites incluyen desayuno buffet (chapín y continental) de 7:00 AM a 11:00 AM, sin costo adicional.' },
  { q: '¿Cuáles son las políticas de check-in y check-out?', a: 'Check-in a partir de las 3:00 PM y check-out a las 12:00 PM (mediodía). Early check-in y late check-out están sujetos a disponibilidad con un costo de Q200.' },
  { q: '¿Puedo cancelar mi reservación?', a: 'Sí. Ofrecemos cancelación gratuita hasta 48 horas antes del check-in. Si cancelas con menos de 48 horas, se cobra el 50% del total. En caso de no presentarse (no-show), se cobra el 100% de la primera noche.' },
  { q: '¿El hotel acepta mascotas?', a: 'Lo sentimos, el hotel no acepta mascotas. Queremos garantizar la comodidad de todos nuestros huéspedes.' },
  { q: '¿Cómo funciona el asistente de IA para reservaciones?', a: 'Haz click en el ícono de chat azul en la esquina inferior derecha. Azul, nuestro asistente virtual, te guiará para hacer tu reservación, responderá preguntas sobre el hotel y verificará disponibilidad en tiempo real.' },
  { q: '¿Tienen WiFi y estacionamiento?', a: 'Sí a ambos. WiFi de alta velocidad en todo el hotel y estacionamiento privado vigilado, ambos sin costo para todos los huéspedes.' },
  { q: '¿Cuáles formas de pago aceptan?', a: 'Aceptamos efectivo (Quetzales y Dólares), Visa y Mastercard. Se requiere el 50% de depósito para confirmar la reservación; el saldo se cancela al check-in.' },
  { q: '¿El hotel es apto para familias con niños?', a: 'Sí. La Suite Presidencial es ideal para familias, con capacidad para hasta 6 personas y cocina equipada. Ofrecemos cuna sin costo adicional (sujeto a disponibilidad).' },
  { q: '¿Qué es la arena negra de Champerico?', a: 'La playa de Champerico tiene arena de origen volcánico, de color negro intenso, característica única del Pacífico guatemalteco. Es cálida, suave y visualmente espectacular, especialmente durante los atardeceres.' },
]

function openChat() {
  const btn = document.querySelector<HTMLButtonElement>('[aria-label="Abrir asistente virtual"]')
  btn?.click()
}

function FAQPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-b from-slate-800 to-slate-700 text-white py-24 text-center">
        <h1 className="text-5xl font-bold mb-4">Preguntas Frecuentes</h1>
        <p className="text-white/70 text-lg">Todo lo que necesitas saber antes de tu visita.</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <button
              className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-semibold text-slate-800">{faq.q}</span>
              <svg
                className={`w-5 h-5 text-blue-500 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-4">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-16 text-center">
        <p className="text-slate-500 text-sm">
          ¿Tienes otra pregunta?{' '}
          <button onClick={openChat} className="text-blue-600 font-semibold hover:underline">
            Chatea con Azul, nuestro asistente virtual
          </button>
          .
        </p>
      </div>
    </div>
  )
}
