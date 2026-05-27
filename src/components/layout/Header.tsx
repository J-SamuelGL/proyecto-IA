import { Link } from '@tanstack/react-router'

const NAV_LINKS = [
  { to: '/' as const, label: 'Inicio' },
  { to: '/habitaciones' as const, label: 'Habitaciones' },
  { to: '/servicios' as const, label: 'Servicios' },
  { to: '/faq' as const, label: 'FAQ' },
]

export function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌊</span>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-none">Azul Horizonte</p>
            <p className="text-xs text-slate-500 leading-none">Boutique Hotel</p>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors"
              activeProps={{ className: 'text-blue-600' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() =>
            (document.querySelector('[aria-label="Abrir asistente virtual"]') as HTMLButtonElement)?.click()
          }
          className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
        >
          Reservar Ahora
        </button>
      </div>
    </header>
  )
}
