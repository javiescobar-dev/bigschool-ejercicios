import type { PurchaseEvent, PurchaseObserver } from '../purchase-observer.ts'
import { loyaltyService } from '../side-effects.ts'

export class LoyaltyPurchaseObserver implements PurchaseObserver {
  onPurchase(event: PurchaseEvent): void {
    loyaltyService.award(event.customerEmail, Math.floor(event.amountCharged))
  }
}
