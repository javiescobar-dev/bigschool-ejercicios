import type { InvoiceFormatter } from './invoice-formatter.ts'
import { TextInvoiceFormatter } from './text-invoice-formatter.ts'
import { HtmlInvoiceFormatter } from './html-invoice-formatter.ts'
import { CsvInvoiceFormatter } from './csv-invoice-formatter.ts'

export const invoiceFormatters: Record<string, InvoiceFormatter> = {
  text: new TextInvoiceFormatter(),
  html: new HtmlInvoiceFormatter(),
  csv:  new CsvInvoiceFormatter(),
}
