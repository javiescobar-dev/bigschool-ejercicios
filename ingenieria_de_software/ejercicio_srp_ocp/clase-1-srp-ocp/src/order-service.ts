import { database } from './infra/database.ts'
import { emailGateway } from './infra/email-gateway.ts'
import type { Order } from './types.ts'

const TAX_RATE = 0.21

/**
 * Servicio de pedidos de PedidoExpress.
 *
 * Aquí ocurre todo lo que pasa cuando un cliente confirma una compra:
 * validar, calcular el precio, generar la factura, guardarla y avisar al
 * cliente por email.
 */
export class OrderService {
  processOrder(order: Order): string {
    // ---------- Validación ----------
    if (order.lines.length === 0) {
      throw new Error('El pedido no tiene líneas')
    }
    if (!order.customer.email.includes('@')) {
      throw new Error(`Email inválido: ${order.customer.email}`)
    }
    for (const line of order.lines) {
      if (line.quantity <= 0) {
        throw new Error(`Cantidad inválida en ${line.sku}`)
      }
      if (line.unitPrice < 0) {
        throw new Error(`Precio inválido en ${line.sku}`)
      }
    }

    // ---------- Subtotal ----------
    let subtotal = 0
    for (const line of order.lines) {
      subtotal += line.unitPrice * line.quantity
    }

    // ---------- Descuento según el tipo de cliente ----------
    let discount = 0
    switch (order.customer.type) {
      case 'standard':
        discount = 0
        break
      case 'premium':
        discount = subtotal * 0.1
        break
      case 'vip':
        discount = subtotal * 0.2
        if (subtotal > 1000) {
          discount = subtotal * 0.25
        }
        break
      case 'employee':
        discount = subtotal * 0.35
        break
    }

    // ---------- Comisión según el método de pago ----------
    let fee = 0
    const afterDiscount = subtotal - discount
    switch (order.paymentMethod) {
      case 'card':
        fee = afterDiscount * 0.015
        break
      case 'paypal':
        fee = afterDiscount * 0.029 + 0.3
        break
      case 'transfer':
        fee = 0
        break
    }

    // ---------- Gastos de envío ----------
    let shipping = 0
    if (order.country === 'ES') {
      shipping = afterDiscount >= 50 ? 0 : 4.95
    } else if (order.country === 'PT' || order.country === 'FR') {
      shipping = afterDiscount >= 80 ? 0 : 9.95
    } else {
      shipping = 24.95
    }

    // ---------- Impuestos y total ----------
    const taxableBase = afterDiscount + fee + shipping
    const tax = taxableBase * TAX_RATE
    const total = Math.round((taxableBase + tax) * 100) / 100

    // ---------- Factura en texto ----------
    let invoice = ''
    invoice += `FACTURA ${order.id}\n`
    invoice += `Cliente: ${order.customer.name} <${order.customer.email}>\n`
    invoice += `${'-'.repeat(40)}\n`
    for (const line of order.lines) {
      const lineTotal = (line.unitPrice * line.quantity).toFixed(2)
      invoice += `${line.quantity} x ${line.description} ... ${lineTotal} EUR\n`
    }
    invoice += `${'-'.repeat(40)}\n`
    invoice += `Subtotal: ${subtotal.toFixed(2)} EUR\n`
    invoice += `Descuento: -${discount.toFixed(2)} EUR\n`
    invoice += `Comisión de pago: ${fee.toFixed(2)} EUR\n`
    invoice += `Envío: ${shipping.toFixed(2)} EUR\n`
    invoice += `IVA (21%): ${tax.toFixed(2)} EUR\n`
    invoice += `TOTAL: ${total.toFixed(2)} EUR\n`

    // ---------- Persistencia ----------
    database.insertOrder({
      id: order.id,
      customerId: order.customer.id,
      total,
      createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
    })

    // ---------- Notificación ----------
    emailGateway.send(
      order.customer.email,
      `Tu pedido ${order.id} está confirmado`,
      `Hola ${order.customer.name},\n\nGracias por tu compra.\n\n${invoice}`,
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
