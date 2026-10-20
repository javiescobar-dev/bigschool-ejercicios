export interface ChargeRequest {
  amountInCents: number
  currency: string
  operation: 'SALE' | 'REFUND'
  cardToken?: string
  accountId?: string
  meta: string
}

export type ChargeResult =
  | { ok: true; authorizationCode: string | null }
  | { ok: false; message: string; retryable: boolean }

export interface ChargeGateway {
  charge(request: ChargeRequest): ChargeResult
}
