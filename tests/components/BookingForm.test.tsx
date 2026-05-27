// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookingForm } from '../../src/components/chat/BookingForm'

const mockOnSubmit = vi.fn()
const mockOnCancel = vi.fn()

function fillForm() {
  fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'María García' } })
  fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'maria@test.com' } })
  fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '50299887766' } })
  fireEvent.change(screen.getByLabelText(/fecha de entrada/i), { target: { value: '2026-06-10' } })
  fireEvent.change(screen.getByLabelText(/fecha de salida/i), { target: { value: '2026-06-12' } })
  fireEvent.change(screen.getByLabelText(/tipo de habitación/i), { target: { value: 'suite-vista-mar' } })
  fireEvent.change(screen.getByLabelText(/número de huéspedes/i), { target: { value: '2' } })
}

describe('BookingForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
  })

  it('renders all 7 required fields', () => {
    render(<BookingForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={false} />)
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha de entrada/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha de salida/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de habitación/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/número de huéspedes/i)).toBeInTheDocument()
  })

  it('calls onSubmit with correct data when form is valid', async () => {
    render(<BookingForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={false} />)
    fillForm()
    fireEvent.submit(screen.getByRole('form'))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'María García',
        email: 'maria@test.com',
        phone: '50299887766',
        checkIn: '2026-06-10',
        checkOut: '2026-06-12',
        roomType: 'suite-vista-mar',
        guests: 2,
      })
    })
  })

  it('does not call onSubmit when required fields are empty', () => {
    render(<BookingForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={false} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('disables submit button when isLoading=true', () => {
    render(<BookingForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={true} />)
    expect(screen.getByRole('button', { name: /verificando/i })).toBeDisabled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<BookingForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isLoading={false} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(mockOnCancel).toHaveBeenCalledOnce()
  })
})
