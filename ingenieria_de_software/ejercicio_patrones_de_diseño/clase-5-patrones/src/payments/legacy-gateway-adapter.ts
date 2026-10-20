import type { LegacyPaymentRequest, PaymentsGatewayV1 } from '../legacy/payments-gateway-v1.ts'
import type { ChargeGateway, ChargeRequest, ChargeResult } from './gateway.ts'

export class LegacyGatewayAdapter implements ChargeGateway {
  constructor(private readonly legacy: PaymentsGatewayV1) {}

  charge(request: ChargeRequest): ChargeResult {
    const legacyRequest: LegacyPaymentRequest = {
      AMOUNT_IN_CENTS: request.amountInCents,
      CURRENCY_CODE: request.currency,
      OPERATION: request.operation,
      CARD_TOKEN: request.cardToken,
      ACCOUNT_ID: request.accountId,
      META: request.meta,
    }

    const response = this.legacy.execute(legacyRequest)

    if (response.RESULT_CODE === '00') {
      return { ok: true, authorizationCode: response.AUTH_CODE ?? null }
    }

    return {
      ok: false,
      message: translateGatewayCode(response.RESULT_CODE),
      retryable: response.RESULT_CODE === '99',
    }
  }
}

function translateGatewayCode(code: string): string {
  if (code === '05') return 'Tarjeta rechazada por el banco emisor'
  if (code === '51') return 'Fondos insuficientes'
  if (code === '99') return 'La pasarela de pago no responde'
  return 'Error desconocido en la pasarela'
}
