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
