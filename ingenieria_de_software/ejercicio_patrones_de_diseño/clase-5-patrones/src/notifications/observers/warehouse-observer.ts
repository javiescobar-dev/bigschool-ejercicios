import type { PurchaseEvent, PurchaseObserver } from '../purchase-observer.ts'
import { warehouseService } from '../side-effects.ts'

export class WarehousePurchaseObserver implements PurchaseObserver {
  onPurchase(event: PurchaseEvent): void {
    warehouseService.schedulePrinting(event.orderId, event.quantity)
  }
}
