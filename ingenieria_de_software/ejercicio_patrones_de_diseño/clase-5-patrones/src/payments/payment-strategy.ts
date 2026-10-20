import type { CheckoutRequest, PaymentMethod } from '../types.ts'
import type { ChargeRequest, ChargeResult } from './gateway.ts'

export type ChargeFn = (request: ChargeRequest) => ChargeResult

export type PaymentOutcome =
  | {
      ok: true
      amountCharged: number
      authorizationCode: string | null
      message: string
    }
  | { ok: false; message: string }

export interface PaymentStrategy {
  readonly method: PaymentMethod
  validate(request: CheckoutRequest): void
  charge(amount: number, request: CheckoutRequest, chargeFn: ChargeFn): PaymentOutcome
}

// Helpers compartidos del módulo de pagos
export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function buildMeta(request: CheckoutRequest): string {
  return `order=${request.orderId};event=${request.eventId};qty=${request.quantity}`
}
