import type { PaymentMethod } from '../types.ts'

export interface PurchaseEvent {
  orderId: string
  eventId: string
  customerEmail: string
  quantity: number
  amountCharged: number
  paymentMethod: PaymentMethod
}

export interface PurchaseObserver {
  onPurchase(event: PurchaseEvent): void
}
