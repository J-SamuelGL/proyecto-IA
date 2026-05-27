import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/servicios')({
  component: ServiciosPage,
})

const SERVICES = [
  {
    category: 'Gastronomía',
    emoji: '🍽️',
    items: [
      { name: 'Cena Romántica en la Orilla', price: 'Q600/pareja', desc: 'Mesa privada a la orilla del Pacífico con antorchas, decoración floral y menú de 4 tiempos con mariscos frescos del día.' },
      { name: 'Desayuno Buffet en Terraza', price: 'Incluido', desc: 'Buffet chapín y continental de 7:00 AM a 11:00 AM con productos locales frescos.' },
    ],
  },
  {
    category: 'Tours Acuáticos',
    emoji: '🌊',
    items: [
      { name: 'Pesca Artesanal Tradicional', price: 'Q350/persona', desc: 'Salida 5:30 AM con pescadores de Champerico. 4 horas en el Pacífico con equipo y snacks incluidos.' },
      { name: 'Kayak y Snorkel', price: 'Q250/persona', desc: '2.5 horas con equipo incluido y guía certificado. Apto para principiantes.' },
      { name: 'Avistamiento de Tortugas', price: 'Q180/persona', desc: 'Tour nocturno para ver el desove de tortugas golfinas (temporada jul–nov). Máx. 8 personas.' },
    ],
  },
  {
    category: 'Bienestar',
    emoji: '💆',
    items: [
      { name: 'Masaje Terapéutico Frente al Mar', price: 'Q450/sesión', desc: 'Masaje de 60 min en terraza con vista al Pacífico. Sueco o tejido profundo. Reservación con 4h de anticipación.' },
    ],
  },
  {
    category: 'Reservaciones Premium',
    emoji: '✨',
    items: [
      { name: 'Decoración Especial de Habitación', price: 'Q300', desc: 'Flores, velas y pétalos para una llegada sorpresa e íntima.' },
      { name: 'Traslado Privado', price: 'Q400/viaje', desc: 'Servicio puerta a puerta desde Ciudad de Guatemala o Retalhuleu.' },
      { name: 'Picnic Privado en la Playa', price: 'Q500/pareja', desc: 'Canasta gourmet y área privada en la orilla del Pacífico.' },
    ],
  },
]

function ServiciosPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-b from-cyan-700 to-teal-600 text-white py-24 text-center">
        <h1 className="text-5xl font-bold mb-4">Servicios y Experiencias</h1>
        <p className="text-white/80 text-lg max-w-xl mx-auto">
          Más allá de la habitación. Vive el Pacífico guatemalteco de una forma que no olvidarás.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        {SERVICES.map((cat) => (
          <div key={cat.category}>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">{cat.emoji}</span> {cat.category}
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              {cat.items.map((item) => (
                <div key={item.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-800">{item.name}</h3>
                    <span className="text-blue-600 font-bold text-sm ml-4 whitespace-nowrap">{item.price}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
