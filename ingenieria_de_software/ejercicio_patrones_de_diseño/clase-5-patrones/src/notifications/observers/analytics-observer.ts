import type { PurchaseEvent, PurchaseObserver } from '../purchase-observer.ts'
import { analyticsService } from '../side-effects.ts'

export class AnalyticsPurchaseObserver implements PurchaseObserver {
  onPurchase(event: PurchaseEvent): void {
    analyticsService.track('ticket_purchased', {
      orderId: event.orderId,
      eventId: event.eventId,
      amount: event.amountCharged,
      method: event.paymentMethod,
    })
  }
}
