import { describe, expect, it } from 'vitest'
import { formatDateSpanish, formatMoney, invoiceLabel, sortInvoicesByTotalDesc } from '../src/formatting.ts'
import type { Invoice } from '../src/types.ts'

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return { id: 'F-1', total: 500, status: 'paid', dueInDays: 5, ...overrides }
}

describe('formatDateSpanish', () => {
  it('escribe la fecha en castellano', () => {
    expect(formatDateSpanish('2024-03-01T10:00:00.000Z')).toBe('1 de marzo de 2024')
    expect(formatDateSpanish('2024-12-25T00:00:00.000Z')).toBe('25 de diciembre de 2024')
    expect(formatDateSpanish('2023-08-09T23:59:00.000Z')).toBe('9 de agosto de 2023')
  })

  it('acepta también fechas sin hora', () => {
    expect(formatDateSpanish('2024-01-31')).toBe('31 de enero de 2024')
  })
})

describe('formatMoney', () => {
  it('usa coma decimal y punto de millares', () => {
    expect(formatMoney(1234567.891)).toBe('1.234.567,89 €')
    expect(formatMoney(1000)).toBe('1.000,00 €')
    expect(formatMoney(99.5)).toBe('99,50 €')
    expect(formatMoney(0)).toBe('0,00 €')
  })

  it('coloca el signo delante en los negativos', () => {
    expect(formatMoney(-1234.5)).toBe('-1.234,50 €')
  })
})

describe('sortInvoicesByTotalDesc', () => {
  it('ordena de mayor a menor importe', () => {
    const facturas = [
      invoice({ id: 'F-1', total: 100 }),
      invoice({ id: 'F-2', total: 900 }),
      invoice({ id: 'F-3', total: 450 }),
    ]

    expect(sortInvoicesByTotalDesc(facturas).map((f) => f.id)).toEqual(['F-2', 'F-3', 'F-1'])
  })

  it('no modifica el array original', () => {
    const facturas = [invoice({ id: 'F-1', total: 100 }), invoice({ id: 'F-2', total: 900 })]

    sortInvoicesByTotalDesc(facturas)

    expect(facturas.map((f) => f.id)).toEqual(['F-1', 'F-2'])
  })
})

describe('invoiceLabel', () => {
  it('etiqueta las facturas pagadas según el importe', () => {
    expect(invoiceLabel(invoice({ status: 'paid', total: 1500 }))).toBe('Pagada (importe alto)')
    expect(invoiceLabel(invoice({ status: 'paid', total: 500 }))).toBe('Pagada')
    expect(invoiceLabel(invoice({ status: 'paid', total: 50 }))).toBe('Pagada (importe bajo)')
  })

  it('etiqueta las pendientes según el vencimiento', () => {
    expect(invoiceLabel(invoice({ status: 'pending', dueInDays: -3 }))).toBe('Vencida')
    expect(invoiceLabel(invoice({ status: 'pending', dueInDays: 0 }))).toBe('Vence hoy')
    expect(invoiceLabel(invoice({ status: 'pending', dueInDays: 7 }))).toBe('Vence en 7 días')
  })

  it('etiqueta las anuladas', () => {
    expect(invoiceLabel(invoice({ status: 'cancelled' }))).toBe('Anulada')
  })
})
