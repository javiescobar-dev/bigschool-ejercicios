import type { InvoiceFormatter } from './invoice-formatter.ts'
import { TextInvoiceFormatter } from './text-invoice-formatter.ts'
import type { CalculatedOrder } from '../types.ts'

export class HtmlInvoiceFormatter implements InvoiceFormatter {
    constructor( private readonly textFormatter = new TextInvoiceFormatter() ) {}

    format(order: CalculatedOrder): string {
        let invoice = this.textFormatter.format(order)
        return `<pre>${invoice}</pre>`
    }
}
