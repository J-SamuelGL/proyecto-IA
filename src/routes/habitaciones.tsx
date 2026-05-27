import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/habitaciones')({
  component: HabitacionesPage,
})

const ROOMS = [
  {
    id: 'suite-vista-mar',
    name: 'Suite Vista Mar',
    price: 'Q950',
    usd: '$120',
    capacity: '1–2 personas',
    emoji: '🌊',
    color: 'from-blue-500 to-cyan-400',
    features: ['Cama king size', 'Terraza privada', 'Ducha de lluvia', 'Minibar', 'Vista al Pacífico', 'Desayuno incluido'],
    desc: 'Suite íntima con ventanales que enmarcan el horizonte del Pacífico. Ideal para parejas en escapada romántica frente a la arena negra de Champerico.',
  },
  {
    id: 'suite-frente-mar',
    name: 'Suite Frente al Mar',
    price: 'Q1,450',
    usd: '$180',
    capacity: '2–3 personas',
    emoji: '🌅',
    color: 'from-cyan-500 to-teal-400',
    features: ['Acceso directo a la playa', 'Jacuzzi exterior privado', 'Cama king + cama individual', 'Sala de estar', 'Terraza XL', 'Desayuno incluido'],
    desc: 'Suite espaciosa con acceso directo a la arena negra de Champerico. Jacuzzi exterior privado con vista al Pacífico guatemalteco al atardecer.',
  },
  {
    id: 'suite-presidencial',
    name: 'Suite Presidencial',
    price: 'Q2,200',
    usd: '$280',
    capacity: '2–6 personas',
    emoji: '👑',
    color: 'from-purple-500 to-blue-500',
    features: ['2 habitaciones', 'Terraza panorámica 180°', 'Cocina equipada', 'Mayordomo incluido', 'Sala comedor', 'Desayuno incluido'],
    desc: 'La experiencia definitiva en Champerico. Dos habitaciones, terraza panorámica de 180° y servicio de mayordomo personalizado. Perfecta para familias o grupos.',
  },
]

function HabitacionesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-b from-blue-800 to-blue-600 text-white py-24 text-center">
        <h1 className="text-5xl font-bold mb-4">Nuestras Suites</h1>
        <p className="text-white/80 text-lg max-w-xl mx-auto">
          Tres experiencias frente al Océano Pacífico. Todas incluyen desayuno buffet y WiFi gratuito.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        {ROOMS.map((room) => (
          <div key={room.id} className="bg-white rounded-3xl shadow-md overflow-hidden flex flex-col md:flex-row">
            <div className={`bg-gradient-to-br ${room.color} md:w-64 flex-shrink-0 flex items-center justify-center py-16 md:py-0`}>
              <span className="text-8xl">{room.emoji}</span>
            </div>
            <div className="p-8 flex-1">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{room.name}</h2>
                  <p className="text-slate-500 text-sm mt-1">👥 {room.capacity}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{room.price}</p>
                  <p className="text-slate-400 text-sm">por noche ({room.usd})</p>
                </div>
              </div>
              <p className="text-slate-600 mb-5 leading-relaxed">{room.desc}</p>
              <ul className="flex flex-wrap gap-2">
                {room.features.map((f) => (
                  <li key={f} className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                    ✓ {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
