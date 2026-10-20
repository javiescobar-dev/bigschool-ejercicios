import type { PurchaseObserver } from '../purchase-observer.ts'
import { AnalyticsPurchaseObserver } from './analytics-observer.ts'
import { EmailPurchaseObserver } from './email-observer.ts'
import { InventoryPurchaseObserver } from './inventory-observer.ts'
import { LoyaltyPurchaseObserver } from './loyalty-observer.ts'
import { WarehousePurchaseObserver } from './warehouse-observer.ts'

export function defaultPurchaseObservers(): PurchaseObserver[] {
  return [
    new EmailPurchaseObserver(),
    new AnalyticsPurchaseObserver(),
    new InventoryPurchaseObserver(),
    new LoyaltyPurchaseObserver(),
    new WarehousePurchaseObserver(),
  ]
}
