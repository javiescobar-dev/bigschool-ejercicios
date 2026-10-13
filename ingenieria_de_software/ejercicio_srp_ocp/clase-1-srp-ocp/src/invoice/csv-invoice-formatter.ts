import type { InvoiceFormatter } from './invoice-formatter.ts'
import type { CalculatedOrder } from '../types.ts'

export class CsvInvoiceFormatter implements InvoiceFormatter {
    format(order: CalculatedOrder): string {
        // ---------- Factura en CSV ----------
        return order.lines
        .map((line) => `${line.quantity} x ${line.description};${line.total.toFixed(2)} EUR`)
        .join('\n')
    }
}
