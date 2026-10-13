import type { Order } from './types.ts'
import { OrderValidator } from './validation/order-validator.ts'
import { OrderCalculator } from './pricing/order-calculator.ts'
import { invoiceFormatters } from './invoice/formatter.ts'
import { OrderRepository } from './order-repository.ts'
import { OrderNotifier } from './order-notifier.ts'

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
    private readonly repository = new OrderRepository(),
    private readonly notifier = new OrderNotifier(),
  ) {}

  processOrder(order: Order): string {
    // ---------- Validación ----------
    this.validator.validate(order)

    // ---------- Cálculo del precio ----------
    const calculatedOrder = this.calculator.calculate(order)

    // ---------- Factura en texto ----------
    const invoice = this.formatters.text.format(calculatedOrder)

    // ---------- Persistencia ----------
    this.repository.save(calculatedOrder)

    // ---------- Notificación ----------
    this.notifier.notify(calculatedOrder, invoice)

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
