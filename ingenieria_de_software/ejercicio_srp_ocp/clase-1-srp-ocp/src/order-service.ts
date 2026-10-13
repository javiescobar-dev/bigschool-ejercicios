import { database } from './infra/database.ts'
import { emailGateway } from './infra/email-gateway.ts'
import type { Order } from './types.ts'
import { OrderValidator } from './validation/order-validator.ts'
import { OrderCalculator } from './pricing/order-calculator.ts'
import { invoiceFormatters } from './invoice/formatter.ts'
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
    private readonly formatters = invoiceFormatters,
  ) {}

  processOrder(order: Order): string {
    // ---------- Validación ----------
    this.validator.validate(order)

    // ---------- Cálculo del precio ----------
    const calculatedOrder = this.calculator.calculate(order)

    // ---------- Factura en texto ----------
    const invoice = this.formatters.text.format(calculatedOrder)

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
  exportInvoice(order: Order, format: string): string {
    const calculatedOrder = this.calculator.calculate(order)
    const formatter = this.formatters[format]
    if (!formatter) throw new Error(`Formato no soportado: ${format}`)
    return formatter.format(calculatedOrder)
  }
}
