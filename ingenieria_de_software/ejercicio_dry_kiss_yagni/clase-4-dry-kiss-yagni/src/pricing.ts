import type { Invoice, ShippingOrder } from './types.ts'

export function calculateShippingCost(order: ShippingOrder): number {
  let cost = 0
  if (order.country === 'ES') {
    if (order.isExpress) {
      if (order.weightKg > 10) {
        if (order.isFragile) {
          cost = 29.95
        } else {
          cost = 24.95
        }
      } else {
        if (order.isFragile) {
          cost = 14.95
        } else {
          cost = 9.95
        }
      }
    } else {
      if (order.weightKg > 10) {
        if (order.isFragile) {
          cost = 12.95
        } else {
          cost = 8.95
        }
      } else {
        if (order.subtotal >= 50) {
          cost = 0
        } else {
          if (order.isFragile) {
            cost = 7.95
          } else {
            cost = 4.95
          }
        }
      }
    }
  } else if (order.country === 'PT' || order.country === 'FR' || order.country === 'IT') {
    if (order.isExpress) {
      if (order.weightKg > 10) {
        cost = 39.95
      } else {
        cost = 19.95
      }
    } else {
      if (order.weightKg > 10) {
        cost = 22.95
      } else {
        if (order.subtotal >= 80) {
          cost = 0
        } else {
          cost = 9.95
        }
      }
    }
  } else {
    if (order.isExpress) {
      cost = 59.95
    } else {
      cost = 24.95
    }
  }

  if (order.isGift) {
    if (cost > 0) {
      cost = cost + 2.5
    } else {
      cost = 2.5
    }
  }

  return Math.round(cost * 100) / 100
}

export function totalWithTax(subtotal: number): number {
  return Math.round(subtotal * 1.21 * 100) / 100
}

export function invoiceTotal(invoice: Invoice): number {
  const tax = invoice.total * 0.21
  return Math.round((invoice.total + tax) * 100) / 100
}

export function quoteTotal(basePrice: number, extras: number[]): number {
  const subtotal = basePrice + extras.reduce((sum, extra) => sum + extra, 0)
  return Math.round(subtotal * 1.21 * 100) / 100
}

export function refundAmount(paidAmount: number): number {
  // Se devuelve el importe sin los impuestos.
  return Math.round((paidAmount / 1.2) * 100) / 100
}
