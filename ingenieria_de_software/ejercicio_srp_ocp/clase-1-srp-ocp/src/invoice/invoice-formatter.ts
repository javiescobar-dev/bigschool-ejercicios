import type { CalculatedOrder } from '../types.ts'
export interface InvoiceFormatter {
  format(order: CalculatedOrder): string
}
