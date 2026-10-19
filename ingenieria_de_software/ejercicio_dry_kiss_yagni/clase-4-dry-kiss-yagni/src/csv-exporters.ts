import type { Customer, Refund, Sale } from './types.ts'
import { formatDateSpanish } from './formatting.ts'

function csvEscape(value: string): string {
  return value.replace(/;/g, ',')
}

function buildCsv(header: string[], rows: string[][], footer: string): string {
  const csvRows: string[] = []

  csvRows.push(header.join(';'))

  for (const row of rows) {
    csvRows.push(row.join(';'))
  }

  csvRows.push(footer)

  return csvRows.join('\n') + '\n'
}

export function exportSalesCsv(sales: Sale[]): string {
  const rows: string[][] = []

  let total = 0
  for (const sale of sales) {
    rows.push([
      sale.id,
      formatDateSpanish(sale.date),
      csvEscape(sale.customerName),
      sale.amount.toFixed(2),
      sale.country,
    ])
    total += sale.amount
  }

  const footer = `TOTAL;;;${total.toFixed(2)};`
  return buildCsv(['id', 'fecha', 'cliente', 'importe', 'pais'], rows, footer)
}

export function exportRefundsCsv(refunds: Refund[]): string {
  const rows: string[][] = []
  let total = 0

  for (const refund of refunds) {
    rows.push([
      refund.id,
      formatDateSpanish(refund.date),
      csvEscape(refund.customerName),
      refund.amount.toFixed(2),
      csvEscape(refund.reason)
    ])
    total += refund.amount
  }

  const footer = `TOTAL;;;${total.toFixed(2)};`
  return buildCsv(['id', 'fecha', 'cliente', 'importe', 'motivo'], rows, footer)
}

export function exportCustomersCsv(customers: Customer[]): string {
  const rows: string[][] = []

  for (const customer of customers) {
    rows.push([
      customer.id,
      formatDateSpanish(customer.signedUpAt),
      csvEscape(customer.fullName),
      customer.email,
      customer.country
    ])
  }
  const footer = `TOTAL;;;${customers.length};`
  return buildCsv(['id', 'alta', 'nombre', 'email', 'pais'], rows, footer)
}
