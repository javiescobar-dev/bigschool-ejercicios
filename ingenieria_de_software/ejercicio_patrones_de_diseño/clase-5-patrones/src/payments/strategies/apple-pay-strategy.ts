import type { CheckoutRequest } from '../../types.ts'
import type { ChargeFn, PaymentOutcome, PaymentStrategy } from '../payment-strategy.ts'
import { buildMeta, round2 } from '../payment-strategy.ts'

export class ApplePayPaymentStrategy implements PaymentStrategy {
  readonly method = 'apple-pay' as const

  validate(request: CheckoutRequest): void {
    if (!request.applePayToken) throw new Error('Falta el token de Apple Pay')
  }

  charge(amount: number, request: CheckoutRequest, chargeFn: ChargeFn): PaymentOutcome {
    const total = round2(amount + amount * 0.01)

    const result = chargeFn({
      amountInCents: Math.round(total * 100),
      currency: 'EUR',
      operation: 'SALE',
      cardToken: request.applePayToken ?? undefined,
      meta: buildMeta(request),
    })

    if (!result.ok) return { ok: false, message: result.message }

    return {
      ok: true,
      amountCharged: total,
      authorizationCode: result.authorizationCode,
      message: 'Pago con Apple Pay aceptado',
    }
  }
}
