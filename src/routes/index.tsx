import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function openChat() {
  const btn = document.querySelector<HTMLButtonElement>('[aria-label="Abrir asistente virtual"]')
  btn?.click()
}

function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-800 to-cyan-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-300 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-cyan-300 text-sm font-semibold uppercase tracking-widest mb-4">
            🌊 Playa Champerico, Retalhuleu, Guatemala
          </p>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Donde el Pacífico<br />
            <span className="text-cyan-300">te abraza</span>
          </h1>
          <p className="text-xl text-white/80 mb-10 leading-relaxed max-w-xl mx-auto">
            Hotel boutique frente a la arena negra volcánica de Champerico. Suites de lujo, experiencias únicas y el atardecer más hermoso del Pacífico guatemalteco.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/habitaciones"
              className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-full hover:bg-cyan-50 transition-colors text-lg">
              Ver Habitaciones
            </a>
            <button onClick={openChat}
              className="border-2 border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-colors text-lg">
              🤖 Reservar con IA
            </button>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-4">Una experiencia única en Guatemala</h2>
          <p className="text-center text-slate-500 mb-12 max-w-xl mx-auto">
            Tres suites boutique frente al Pacífico, en la playa de arena negra volcánica de Champerico.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: '🌊', title: 'Frente al Pacífico', desc: 'Despierta con el sonido de las olas. Todas nuestras suites tienen acceso directo a la playa de arena negra volcánica.' },
              { emoji: '🍳', title: 'Desayuno Incluido', desc: 'Buffet chapín y continental de 7 a 11 AM: huevos al gusto, tamales, frutas tropicales y café de exportación.' },
              { emoji: '🤖', title: 'Reserva con IA', desc: 'Nuestro asistente Azul te ayuda a reservar en minutos y confirma disponibilidad al instante.' },
            ].map((f) => (
              <div key={f.title} className="text-center p-8 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors">
                <div className="text-5xl mb-4">{f.emoji}</div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms preview */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Nuestras Suites</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '🌊', name: 'Suite Vista Mar', price: 'Q950/noche', cap: 'Hasta 2 personas', color: 'from-blue-500 to-cyan-400' },
              { emoji: '🌅', name: 'Suite Frente al Mar', price: 'Q1,450/noche', cap: 'Hasta 3 personas', color: 'from-cyan-500 to-teal-400' },
              { emoji: '👑', name: 'Suite Presidencial', price: 'Q2,200/noche', cap: 'Hasta 6 personas', color: 'from-purple-500 to-blue-500' },
            ].map((r) => (
              <div key={r.name} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className={`bg-gradient-to-br ${r.color} h-40 flex items-center justify-center text-6xl`}>{r.emoji}</div>
                <div className="p-5">
                  <h3 className="font-semibold text-slate-800">{r.name}</h3>
                  <p className="text-blue-600 font-bold">{r.price}</p>
                  <p className="text-slate-400 text-sm">{r.cap}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="/habitaciones" className="inline-flex bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-full transition-colors">
              Ver detalles de habitaciones
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4">¿Listo para escapar al Pacífico?</h2>
          <p className="text-white/80 text-lg mb-8">Habla con Azul, nuestro asistente virtual, y confirma tu reservación en minutos.</p>
          <button onClick={openChat}
            className="bg-white text-blue-600 font-bold px-10 py-4 rounded-full text-lg hover:bg-cyan-50 transition-colors shadow-lg">
            Chatear con Azul 🌊
          </button>
        </div>
      </section>
    </div>
  )
}
