import type { PurchaseObserver, PurchaseEvent } from '../purchase-observer.ts'

const ANTIFRAUD_THRESHOLD = 200

export interface AntifraudAlert {
  orderId: string
  customerEmail: string
  amountCharged: number
  reason: string
}

export const antifraudAlerts: AntifraudAlert[] = []

export class AntifraudPurchaseObserver implements PurchaseObserver {
  onPurchase(event: PurchaseEvent): void {
    if (event.amountCharged <= ANTIFRAUD_THRESHOLD) return

    antifraudAlerts.push({
      orderId: event.orderId,
      customerEmail: event.customerEmail,
      amountCharged: event.amountCharged,
      reason: 'Importe por encima del umbral de revisión',
    })
  }
}
