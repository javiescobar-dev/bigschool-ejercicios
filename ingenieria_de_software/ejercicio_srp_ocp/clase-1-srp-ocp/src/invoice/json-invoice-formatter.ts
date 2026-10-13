import type { InvoiceFormatter } from './invoice-formatter.ts'
import type { CalculatedOrder } from '../types.ts'

export class JsonInvoiceFormatter implements InvoiceFormatter {
    format(order: CalculatedOrder): string {
        return JSON.stringify(order, null, 2)
    }
}
