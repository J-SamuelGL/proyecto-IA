import { useState, type FormEvent } from 'react'
import type { BookingData } from '#/lib/zapier'
import type { BookingPrefill } from '#/lib/claude'

interface Props {
  prefill?: BookingPrefill
  onSubmit: (data: BookingData) => void
  onCancel: () => void
  isLoading: boolean
}

const ROOM_NAMES: Record<BookingPrefill['roomType'], string> = {
  SVM: 'Suite Vista Mar — Q950/noche',
  SFM: 'Suite Frente al Mar — Q1,450/noche',
  SP:  'Suite Presidencial — Q2,200/noche',
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'America/Guatemala',
  })
}

export function BookingForm({ prefill, onSubmit, onCancel, isLoading }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', guests: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!prefill) return
    onSubmit({
      name: form.name,
      email: form.email,
      phone: form.phone,
      checkIn: prefill.checkIn,
      checkOut: prefill.checkOut,
      roomType: prefill.roomType,
      guests: parseInt(form.guests, 10),
    })
  }

  const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1'
  const readonlyClass = 'w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium'

  return (
    <form
      aria-label="Formulario de reservación"
      onSubmit={handleSubmit}
      className="bg-slate-50 border border-blue-100 rounded-xl p-4 mt-2 space-y-3"
    >
      <p className="text-sm font-semibold text-slate-700 mb-1">📋 Datos de Reservación</p>

      {prefill && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <div>
            <p className={labelClass}>Habitación</p>
            <p className={readonlyClass}>{ROOM_NAMES[prefill.roomType]}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className={labelClass}>Check-in</p>
              <p className={readonlyClass}>{formatDateTime(prefill.checkIn)}</p>
            </div>
            <div>
              <p className={labelClass}>Check-out</p>
              <p className={readonlyClass}>{formatDateTime(prefill.checkOut)}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>Nombre completo *</label>
        <input id="name" name="name" type="text" required value={form.name} onChange={handleChange}
          placeholder="Ej. María García" className={inputClass} />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Correo electrónico *</label>
        <input id="email" name="email" type="email" required value={form.email} onChange={handleChange}
          placeholder="correo@ejemplo.com" className={inputClass} />
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>Teléfono *</label>
        <input id="phone" name="phone" type="tel" required value={form.phone} onChange={handleChange}
          placeholder="502 XXXX XXXX" className={inputClass} />
      </div>

      <div>
        <label htmlFor="guests" className={labelClass}>Número de huéspedes *</label>
        <select id="guests" name="guests" required value={form.guests} onChange={handleChange} className={inputClass}>
          <option value="">Seleccionar...</option>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={isLoading || !prefill}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
          {isLoading ? 'Procesando...' : 'Confirmar reservación'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
