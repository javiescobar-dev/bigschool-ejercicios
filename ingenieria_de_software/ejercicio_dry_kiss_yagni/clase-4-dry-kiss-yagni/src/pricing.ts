import type { Invoice, ShippingOrder } from './types.ts'

const TAX_RATE = 0.21

function round2(num: number): number {
  return Math.round(num * 100) / 100
}

function applyTax(amount: number): number {
  return round2(amount * (1 + TAX_RATE))
}

function removeTax(amount: number): number {
  return round2(amount / (1 + TAX_RATE))
}

type Zone = 'ES' | 'EU' | 'WORLD'
type Type = 'express' | 'standard'
type WeightRange = 'light' | 'heavy'          // light = ≤10 kg, heavy = >10 kg
type Fee = { normal: number; fragile: number }

const COSTS: Record<Zone, Record<Type, Record<WeightRange, Fee>>> = {
  ES: {
    express:  { light: { normal: 9.95,  fragile: 14.95 }, heavy: { normal: 24.95, fragile: 29.95 } },
    standard: { light: { normal: 4.95,  fragile: 7.95  }, heavy: { normal: 8.95,  fragile: 12.95 } },
  },
  EU: {
    express:  { light: { normal: 19.95, fragile: 19.95 }, heavy: { normal: 39.95, fragile: 39.95 } },
    standard: { light: { normal: 9.95,  fragile: 9.95  }, heavy: { normal: 22.95, fragile: 22.95 } },
  },
  WORLD: {
    express:  { light: { normal: 59.95, fragile: 59.95 }, heavy: { normal: 59.95, fragile: 59.95 } },
    standard: { light: { normal: 24.95, fragile: 24.95 }, heavy: { normal: 24.95, fragile: 24.95 } },
  },
}

const FREE_SHIPPING_THRESHOLD: Partial<Record<Zone, number>> = { ES: 50, EU: 80 }   // WORLD does not have free shipping threshold
const GIFT_SURCHARGE = 2.5

function zoneOf(country: string): Zone {
  if (country === 'ES') return 'ES'
  if (country === 'PT' || country === 'FR' || country === 'IT') return 'EU'
  return 'WORLD'
}

function isFreeShipping(zone: Zone, order: ShippingOrder): boolean {
  if (order.isExpress || order.weightKg > 10) return false   // minimun for free shipping
  const threshold = FREE_SHIPPING_THRESHOLD[zone]
  return threshold !== undefined && order.subtotal >= threshold
}

export function calculateShippingCost(order: ShippingOrder): number {
  const zone = zoneOf(order.country)

  if (isFreeShipping(zone, order)) {
    return order.isGift ? GIFT_SURCHARGE : 0
  }

  const type = order.isExpress ? 'express' : 'standard'
  const weightRange = order.weightKg > 10 ? 'heavy' : 'light'
  const fee = COSTS[zone][type][weightRange]

  let cost = order.isFragile ? fee.fragile : fee.normal
  if (order.isGift) cost += GIFT_SURCHARGE
  return round2(cost)
}

export function totalWithTax(subtotal: number): number {
  return applyTax(subtotal)
}

export function invoiceTotal(invoice: Invoice): number {
  return applyTax(invoice.total)
}

export function quoteTotal(basePrice: number, extras: number[]): number {
  const subtotal = basePrice + extras.reduce((sum, extra) => sum + extra, 0)
  return applyTax(subtotal)
}

export function refundAmount(paidAmount: number): number {
  // Se devuelve el importe sin los impuestos.
  return removeTax(paidAmount)
}
