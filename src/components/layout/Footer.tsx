export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🌊</span>
            <div>
              <p className="text-white font-bold leading-none">Azul Horizonte</p>
              <p className="text-xs leading-none mt-0.5">Boutique Hotel</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            Donde el Pacífico te abraza.<br />
            Playa Champerico, Retalhuleu, Guatemala.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Contacto</h4>
          <ul className="space-y-1 text-sm">
            <li>📧 reservas@azulhorizonte.gt</li>
            <li>📞 +502 7700 0000</li>
            <li>📍 Champerico, Retalhuleu</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Políticas Rápidas</h4>
          <ul className="space-y-1 text-sm">
            <li>Check-in: 3:00 PM | Check-out: 12:00 PM</li>
            <li>Estancia mínima: 2 noches</li>
            <li>Cancelación gratuita hasta 48h antes</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 pt-8 mt-8 border-t border-slate-800 text-center text-xs">
        © {new Date().getFullYear()} Azul Horizonte Boutique Hotel — Playa Champerico, Guatemala.
      </div>
    </footer>
  )
}
