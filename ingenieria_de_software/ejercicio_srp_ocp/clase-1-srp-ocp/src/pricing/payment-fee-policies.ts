import type { PaymentMethod } from '../types.ts'

export interface FeePolicy {
    feeFor(afterDiscount: number): number
}

export class CardFeePolicy implements FeePolicy {
    feeFor(afterDiscount: number): number {
        return afterDiscount * 0.015
    }
}

export class PaypalFeePolicy implements FeePolicy {
    feeFor(afterDiscount: number): number {
        return afterDiscount * 0.029 + 0.3
    }
}

export class TransferFeePolicy implements FeePolicy {
    feeFor(afterDiscount: number): number {
        return 0
    }
}

export const feePolicies: Record<PaymentMethod, FeePolicy> = {
    card:     new CardFeePolicy(),
    paypal:   new PaypalFeePolicy(),
    transfer: new TransferFeePolicy(),
}
