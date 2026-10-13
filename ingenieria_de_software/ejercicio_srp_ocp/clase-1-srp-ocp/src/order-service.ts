import { database } from './infra/database.ts'
import { emailGateway } from './infra/email-gateway.ts'
import type { Order } from './types.ts'
import { OrderValidator } from './validation/order-validator.ts'
import { OrderCalculator } from './pricing/order-calculator.ts'

/**
 * Servicio de pedidos de PedidoExpress.
 *
 * Aquí ocurre todo lo que pasa cuando un cliente confirma una compra:
 * validar, calcular el precio, generar la factura, guardarla y avisar al
 * cliente por email.
 */
export class OrderService {
  constructor(
    private readonly validator = new OrderValidator(),
    private readonly calculator = new OrderCalculator(),
  ) {}

  processOrder(order: Order): string {
    // ---------- Validación ----------
    this.validator.validate(order)

    // ---------- Cálculo del precio ----------
    const calculatedOrder = this.calculator.calculate(order)

    // ---------- Factura en texto ----------
    let invoice = ''
    invoice += `FACTURA ${calculatedOrder.orderId}\n`
    invoice += `Cliente: ${calculatedOrder.customer.name} <${calculatedOrder.customer.email}>\n`
    invoice += `${'-'.repeat(40)}\n`
    for (const line of calculatedOrder.lines) {
        const lineTotal = line.total.toFixed(2)
        invoice += `${line.quantity} x ${line.description} ... ${lineTotal} EUR\n`
    }
    invoice += `${'-'.repeat(40)}\n`
    invoice += `Subtotal: ${calculatedOrder.subtotal.toFixed(2)} EUR\n`
    invoice += `Descuento: -${calculatedOrder.discount.toFixed(2)} EUR\n`
    invoice += `Comisión de pago: ${calculatedOrder.fee.toFixed(2)} EUR\n`
    invoice += `Envío: ${calculatedOrder.shipping.toFixed(2)} EUR\n`
    invoice += `IVA (${Math.round(calculatedOrder.taxRate * 100)}%): ${calculatedOrder.taxAmount.toFixed(2)} EUR\n`
    invoice += `TOTAL: ${calculatedOrder.total.toFixed(2)} EUR\n`

    // ---------- Persistencia ----------
    database.insertOrder({
      id: calculatedOrder.orderId,
      customerId: calculatedOrder.customer.id,
      total: calculatedOrder.total,
      createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    })

    // ---------- Notificación ----------
    emailGateway.send(
      calculatedOrder.customer.email,
      `Tu pedido ${calculatedOrder.orderId} está confirmado`,
      `Hola ${calculatedOrder.customer.name},\n\nGracias por tu compra.\n\n${invoice}`,
    )

    return invoice
  }

  /**
   * Exporta la factura de un pedido ya calculado en distintos formatos.
   */
  exportInvoice(order: Order, format: 'text' | 'html' | 'csv'): string {
    const invoice = this.processOrder(order)

    if (format === 'text') {
      return invoice
    } else if (format === 'html') {
      return `<pre>${invoice}</pre>`
    } else if (format === 'csv') {
      return invoice
        .split('\n')
        .filter((line) => line.includes('...'))
        .map((line) => line.replace(' ... ', ';'))
        .join('\n')
    } else {
      throw new Error(`Formato no soportado: ${format}`)
    }
  }
}
