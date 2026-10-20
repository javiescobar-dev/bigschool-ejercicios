import type { CheckoutRequest } from '../../types.ts'
import type { ChargeFn, PaymentOutcome, PaymentStrategy } from '../payment-strategy.ts'
import { round2 } from '../payment-strategy.ts'

export class TransferPaymentStrategy implements PaymentStrategy {
  readonly method = 'transfer' as const

  validate(_request: CheckoutRequest): void {}

  charge(amount: number, _request: CheckoutRequest, _chargeFn: ChargeFn): PaymentOutcome {
    return {
      ok: true,
      amountCharged: round2(amount),
      authorizationCode: null,
      message: 'Transferencia pendiente de confirmación bancaria',
    }
  }
}
