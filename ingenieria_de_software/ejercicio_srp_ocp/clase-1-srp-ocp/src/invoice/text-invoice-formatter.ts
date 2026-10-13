import type { InvoiceFormatter } from './invoice-formatter.ts'
import type { CalculatedOrder } from '../types.ts'

export class TextInvoiceFormatter implements InvoiceFormatter {
    format(order: CalculatedOrder): string {
        // ---------- Factura en texto ----------
        let invoice = ''
        invoice += `FACTURA ${order.orderId}\n`
        invoice += `Cliente: ${order.customer.name} <${order.customer.email}>\n`
        invoice += `${'-'.repeat(40)}\n`
        for (const line of order.lines) {
            const lineTotal = line.total.toFixed(2)
            invoice += `${line.quantity} x ${line.description} ... ${lineTotal} EUR\n`
        }
        invoice += `${'-'.repeat(40)}\n`
        invoice += `Subtotal: ${order.subtotal.toFixed(2)} EUR\n`
        invoice += `Descuento: -${order.discount.toFixed(2)} EUR\n`
        invoice += `Comisión de pago: ${order.fee.toFixed(2)} EUR\n`
        invoice += `Envío: ${order.shipping.toFixed(2)} EUR\n`
        invoice += `IVA (${Math.round(order.taxRate * 100)}%): ${order.taxAmount.toFixed(2)} EUR\n`
        invoice += `TOTAL: ${order.total.toFixed(2)} EUR\n`
        return invoice
    }
}
