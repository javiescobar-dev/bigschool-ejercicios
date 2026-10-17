import type { Customer, Refund, Sale } from './types.ts'
import { formatDateSpanish } from './formatting.ts'

export function exportSalesCsv(sales: Sale[]): string {
  let csv = 'id;fecha;cliente;importe;pais\n'
  for (const sale of sales) {
    let row = ''
    row += sale.id + ';'
    row += formatDateSpanish(sale.date) + ';'
    row += sale.customerName.replace(/;/g, ',') + ';'
    row += sale.amount.toFixed(2) + ';'
    row += sale.country
    csv += row + '\n'
  }
  csv += 'TOTAL;;;' + sales.reduce((sum, sale) => sum + sale.amount, 0).toFixed(2) + ';\n'
  return csv
}

export function exportRefundsCsv(refunds: Refund[]): string {
  let csv = 'id;fecha;cliente;importe;motivo\n'
  for (const refund of refunds) {
    let row = ''
    row += refund.id + ';'
    row += formatDateSpanish(refund.date) + ';'
    row += refund.customerName.replace(/;/g, ',') + ';'
    row += refund.amount.toFixed(2) + ';'
    row += refund.reason.replace(/;/g, ',')
    csv += row + '\n'
  }
  csv += 'TOTAL;;;' + refunds.reduce((sum, refund) => sum + refund.amount, 0).toFixed(2) + ';\n'
  return csv
}

export function exportCustomersCsv(customers: Customer[]): string {
  let csv = 'id;alta;nombre;email;pais\n'
  for (const customer of customers) {
    let row = ''
    row += customer.id + ';'
    row += formatDateSpanish(customer.signedUpAt) + ';'
    row += customer.fullName.replace(/;/g, ',') + ';'
    row += customer.email + ';'
    row += customer.country
    csv += row + '\n'
  }
  csv += 'TOTAL;;;' + customers.length + ';\n'
  return csv
}
