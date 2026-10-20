import type { PurchaseEvent, PurchaseObserver } from '../purchase-observer.ts'
import { emailService } from '../side-effects.ts'

export class EmailPurchaseObserver implements PurchaseObserver {
  onPurchase(event: PurchaseEvent): void {
    emailService.sendPurchaseConfirmation(event.customerEmail, event.orderId)
  }
}
