import type { PaymentStrategy } from '../payment-strategy.ts'
import { CardPaymentStrategy } from './card-strategy.ts'
import { TransferPaymentStrategy } from './transfer-strategy.ts'
import { VoucherPaymentStrategy } from './voucher-strategy.ts'
import { WalletPaymentStrategy } from './wallet-strategy.ts'

export function defaultPaymentStrategies(): PaymentStrategy[] {
  return [
    new CardPaymentStrategy(),
    new WalletPaymentStrategy(),
    new TransferPaymentStrategy(),
    new VoucherPaymentStrategy(),
  ]
}
