import type { Invoice } from './types.ts'

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function formatDateSpanish(isoDate: string): string {
  const year = isoDate.slice(0, 4)
  const monthNumber = Number(isoDate.slice(5, 7))
  const day = Number(isoDate.slice(8, 10))
  const monthName = MESES[monthNumber - 1] ?? 'desconocido'
  return `${day} de ${monthName} de ${year}`
}

export function sortInvoicesByTotalDesc(invoices: Invoice[]): Invoice[] {
  return [...invoices].sort((a, b) => b.total - a.total)
}

function paidLabel(total: number): string {
  if (total > 1000) return 'Pagada (importe alto)'
  if (total > 100) return 'Pagada'
  return 'Pagada (importe bajo)'
}

function pendingLabel(dueInDays: number): string {
  if (dueInDays < 0) return 'Vencida'
  if (dueInDays === 0) return 'Vence hoy'
  return `Vence en ${dueInDays} días`
}

export function invoiceLabel(invoice: Invoice): string {
  if (invoice.status === 'cancelled') return 'Anulada'
  if (invoice.status === 'pending') return pendingLabel(invoice.dueInDays)
  return paidLabel(invoice.total)
}

const EUROS = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true, // for thousands separator
})

export function formatMoney(amount: number): string {
  return `${EUROS.format(amount)} €`
}
