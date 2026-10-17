import { describe, expect, it } from 'vitest'
import { calculateShippingCost, invoiceTotal, quoteTotal, totalWithTax } from '../src/pricing.ts'
import type { ShippingOrder } from '../src/types.ts'

function order(overrides: Partial<ShippingOrder> = {}): ShippingOrder {
  return {
    country: 'ES',
    weightKg: 2,
    subtotal: 30,
    isExpress: false,
    isFragile: false,
    isGift: false,
    ...overrides,
  }
}

describe('calculateShippingCost', () => {
  describe('España, envío estándar', () => {
    it('es gratis a partir de 50 EUR', () => {
      expect(calculateShippingCost(order({ subtotal: 50 }))).toBe(0)
    })

    it('cuesta 4,95 EUR por debajo de 50 EUR', () => {
      expect(calculateShippingCost(order({ subtotal: 49.99 }))).toBe(4.95)
    })

    it('cuesta 7,95 EUR si el paquete es frágil', () => {
      expect(calculateShippingCost(order({ isFragile: true }))).toBe(7.95)
    })

    it('cuesta 8,95 EUR si pesa más de 10 kg', () => {
      expect(calculateShippingCost(order({ weightKg: 12 }))).toBe(8.95)
    })

    it('cuesta 12,95 EUR si pesa más de 10 kg y es frágil', () => {
      expect(calculateShippingCost(order({ weightKg: 12, isFragile: true }))).toBe(12.95)
    })
  })

  describe('España, envío exprés', () => {
    it('cuesta 9,95 EUR en condiciones normales', () => {
      expect(calculateShippingCost(order({ isExpress: true }))).toBe(9.95)
    })

    it('cuesta 14,95 EUR si es frágil', () => {
      expect(calculateShippingCost(order({ isExpress: true, isFragile: true }))).toBe(14.95)
    })

    it('cuesta 24,95 EUR si pesa más de 10 kg', () => {
      expect(calculateShippingCost(order({ isExpress: true, weightKg: 12 }))).toBe(24.95)
    })

    it('cuesta 29,95 EUR si pesa más de 10 kg y es frágil', () => {
      expect(calculateShippingCost(order({ isExpress: true, weightKg: 12, isFragile: true }))).toBe(29.95)
    })

    it('el envío exprés no se ve afectado por el mínimo de 50 EUR', () => {
      expect(calculateShippingCost(order({ isExpress: true, subtotal: 500 }))).toBe(9.95)
    })
  })

  describe('Unión Europea', () => {
    it('es gratis a partir de 80 EUR en envío estándar', () => {
      expect(calculateShippingCost(order({ country: 'FR', subtotal: 80 }))).toBe(0)
    })

    it('cuesta 9,95 EUR por debajo de 80 EUR', () => {
      expect(calculateShippingCost(order({ country: 'PT', subtotal: 79 }))).toBe(9.95)
    })

    it('cuesta 22,95 EUR si pesa más de 10 kg', () => {
      expect(calculateShippingCost(order({ country: 'IT', weightKg: 11 }))).toBe(22.95)
    })

    it('cuesta 19,95 EUR en exprés y 39,95 EUR si además pesa', () => {
      expect(calculateShippingCost(order({ country: 'FR', isExpress: true }))).toBe(19.95)
      expect(calculateShippingCost(order({ country: 'FR', isExpress: true, weightKg: 11 }))).toBe(39.95)
    })

    it('la fragilidad no encarece los envíos fuera de España', () => {
      expect(calculateShippingCost(order({ country: 'FR', isFragile: true, subtotal: 10 }))).toBe(9.95)
    })
  })

  describe('resto del mundo', () => {
    it('cuesta 24,95 EUR en estándar y 59,95 EUR en exprés', () => {
      expect(calculateShippingCost(order({ country: 'US' }))).toBe(24.95)
      expect(calculateShippingCost(order({ country: 'US', isExpress: true }))).toBe(59.95)
    })
  })

  describe('envoltorio de regalo', () => {
    it('suma 2,50 EUR al coste de envío', () => {
      expect(calculateShippingCost(order({ isGift: true }))).toBe(7.45)
    })

    it('cuesta 2,50 EUR incluso cuando el envío es gratis', () => {
      expect(calculateShippingCost(order({ subtotal: 100, isGift: true }))).toBe(2.5)
    })
  })
})

describe('cálculos con IVA', () => {
  it('totalWithTax aplica el 21%', () => {
    expect(totalWithTax(100)).toBe(121)
  })

  it('invoiceTotal aplica el 21%', () => {
    expect(invoiceTotal({ id: 'F-1', total: 200, status: 'paid', dueInDays: 0 })).toBe(242)
  })

  it('quoteTotal suma los extras y aplica el 21%', () => {
    expect(quoteTotal(100, [20, 30])).toBe(181.5)
  })
})
