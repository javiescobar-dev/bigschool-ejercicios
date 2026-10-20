import type { CheckoutRequest } from '../../types.ts'
import type { ChargeFn, PaymentOutcome, PaymentStrategy } from '../payment-strategy.ts'

export class VoucherPaymentStrategy implements PaymentStrategy {
  readonly method = 'voucher' as const

  validate(request: CheckoutRequest): void {
    if (!request.voucherCode) throw new Error('Falta el código del bono')
  }

  charge(_amount: number, request: CheckoutRequest, _chargeFn: ChargeFn): PaymentOutcome {
    return {
      ok: true,
      amountCharged: 0,
      authorizationCode: `VOUCHER-${request.voucherCode}`,
      message: 'Pedido cubierto íntegramente con un bono',
    }
  }
}
