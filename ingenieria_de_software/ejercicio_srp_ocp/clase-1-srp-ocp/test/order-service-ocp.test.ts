import { beforeEach, describe, expect, it } from 'vitest'
import { OrderService } from '../src/order-service.ts'
import { database } from '../src/infra/database.ts'
import { emailGateway } from '../src/infra/email-gateway.ts'
import type { Customer, Order, OrderLine } from '../src/types.ts'

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'c-1',
    name: 'Ana García',
    email: 'ana@example.com',
    type: 'standard',
    ...overrides,
  }
}

function order(overrides: Partial<Order> = {}): Order {
  const lines: OrderLine[] = [
    { sku: 'TEC-01', description: 'Teclado mecánico', quantity: 2, unitPrice: 25 },
    { sku: 'CAB-07', description: 'Cable USB-C', quantity: 1, unitPrice: 10 },
  ]
  return {
    id: 'ORD-1001',
    customer: customer(),
    lines,
    paymentMethod: 'card',
    country: 'ES',
    ...overrides,
  }
}

describe('OrderService — extensión OCP', () => {
  let service: OrderService

  beforeEach(() => {
    database.clear()
    emailGateway.clear()
    service = new OrderService()
  })

  it('cliente partner: aplica un 15% de descuento', () => {
    const invoice = service.processOrder(order({ customer: customer({ type: 'partner' }) }))

    // subtotal 60 -> 60 * 0,15 = 9,00
    expect(invoice).toContain('Descuento: -9.00 EUR')
  })

  it('pago con Bizum: comisión del 0,5%', () => {
    const invoice = service.processOrder(order({ paymentMethod: 'bizum' }))

    // standard (sin descuento) -> afterDiscount 60 -> 60 * 0,005 = 0,30
    expect(invoice).toContain('Comisión de pago: 0.30 EUR')
  })

  it('envío a país desconocido: usa la tarifa internacional (fallback)', () => {
    const invoice = service.processOrder(order({ country: 'DE' }))

    expect(invoice).toContain('Envío: 24.95 EUR')
  })

  it('exporta la factura en JSON', () => {
    const json = service.exportInvoice(order(), 'json')
    const parsed = JSON.parse(json)

    expect(parsed.orderId).toBe('ORD-1001')
    expect(parsed.total).toBe(73.69)
    expect(parsed.lines).toHaveLength(2)
  })

  it('lanza un error si el formato no está soportado', () => {
    expect(() => service.exportInvoice(order(), 'pdf')).toThrow('Formato no soportado: pdf')
  })
})
