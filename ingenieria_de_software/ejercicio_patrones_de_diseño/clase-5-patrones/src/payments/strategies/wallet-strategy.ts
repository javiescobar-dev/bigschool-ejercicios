import type { CheckoutRequest } from '../../types.ts'
import type { ChargeFn, PaymentOutcome, PaymentStrategy } from '../payment-strategy.ts'
import { buildMeta, round2 } from '../payment-strategy.ts'

export class WalletPaymentStrategy implements PaymentStrategy {
  readonly method = 'wallet' as const

  validate(request: CheckoutRequest): void {
    if (!request.walletAccountId) throw new Error('Falta la cuenta del monedero')
  }

  charge(amount: number, request: CheckoutRequest, chargeFn: ChargeFn): PaymentOutcome {
    const total = round2(amount)

    const result = chargeFn({
      amountInCents: Math.round(total * 100),
      currency: 'EUR',
      operation: 'SALE',
      accountId: request.walletAccountId ?? undefined,
      meta: buildMeta(request),
    })

    if (!result.ok) return { ok: false, message: result.message }

    return {
      ok: true,
      amountCharged: total,
      authorizationCode: result.authorizationCode,
      message: 'Pago con monedero aceptado',
    }
  }
}
