import type { Invoice } from './types.ts'

export function formatDateSpanish(isoDate: string): string {
  const year = isoDate.slice(0, 4)
  const monthNumber = Number(isoDate.slice(5, 7))
  const day = Number(isoDate.slice(8, 10))

  let monthName = ''
  if (monthNumber === 1) {
    monthName = 'enero'
  } else if (monthNumber === 2) {
    monthName = 'febrero'
  } else if (monthNumber === 3) {
    monthName = 'marzo'
  } else if (monthNumber === 4) {
    monthName = 'abril'
  } else if (monthNumber === 5) {
    monthName = 'mayo'
  } else if (monthNumber === 6) {
    monthName = 'junio'
  } else if (monthNumber === 7) {
    monthName = 'julio'
  } else if (monthNumber === 8) {
    monthName = 'agosto'
  } else if (monthNumber === 9) {
    monthName = 'septiembre'
  } else if (monthNumber === 10) {
    monthName = 'octubre'
  } else if (monthNumber === 11) {
    monthName = 'noviembre'
  } else if (monthNumber === 12) {
    monthName = 'diciembre'
  } else {
    monthName = 'desconocido'
  }

  return `${day} de ${monthName} de ${year}`
}

export function sortInvoicesByTotalDesc(invoices: Invoice[]): Invoice[] {
  const result = [...invoices]
  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < result.length - 1 - i; j++) {
      const current = result[j]!
      const next = result[j + 1]!
      if (current.total < next.total) {
        result[j] = next
        result[j + 1] = current
      }
    }
  }
  return result
}

export function invoiceLabel(invoice: Invoice): string {
  return invoice.status === 'paid'
    ? invoice.total > 1000
      ? 'Pagada (importe alto)'
      : invoice.total > 100
        ? 'Pagada'
        : 'Pagada (importe bajo)'
    : invoice.status === 'pending'
      ? invoice.dueInDays < 0
        ? 'Vencida'
        : invoice.dueInDays === 0
          ? 'Vence hoy'
          : `Vence en ${invoice.dueInDays} días`
      : invoice.status === 'cancelled'
        ? 'Anulada'
        : 'Desconocida'
}

export function formatMoney(amount: number): string {
  let result = ''
  const negative = amount < 0
  const absolute = Math.abs(amount)
  const fixed = absolute.toFixed(2)
  const integerPart = fixed.split('.')[0]!
  const decimalPart = fixed.split('.')[1]!

  let grouped = ''
  let counter = 0
  for (let i = integerPart.length - 1; i >= 0; i--) {
    grouped = integerPart[i]! + grouped
    counter++
    if (counter === 3 && i !== 0) {
      grouped = '.' + grouped
      counter = 0
    }
  }

  result = grouped + ',' + decimalPart + ' €'
  if (negative) {
    result = '-' + result
  }
  return result
}
