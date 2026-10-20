import type { PurchaseEvent, PurchaseObserver } from '../purchase-observer.ts'
import { inventoryService } from '../side-effects.ts'

export class InventoryPurchaseObserver implements PurchaseObserver {
  onPurchase(event: PurchaseEvent): void {
    inventoryService.release(event.eventId, event.quantity)
  }
}
