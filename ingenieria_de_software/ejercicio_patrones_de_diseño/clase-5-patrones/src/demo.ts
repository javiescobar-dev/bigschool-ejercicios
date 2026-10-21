import { CheckoutService } from './checkout-service.ts'
import { PaymentsGatewayV1 } from './legacy/payments-gateway-v1.ts'
import { Order } from './order.ts'
import { antifraudAlerts } from './notifications/observers/antifraud-observer.ts'
import { analyticsEvents, mailbox, printQueue } from './notifications/side-effects.ts'
import type { CheckoutRequest } from './types.ts'

const gateway = new PaymentsGatewayV1()
const service = new CheckoutService(gateway, { withLogging: true, withRetry: true, retryAttempts: 3 })

const peticionTarjeta: CheckoutRequest = {
  orderId: 'ORD-2045',
  eventId: 'EVT-9',
  customerEmail: 'ana@example.com',
  customerName: 'Ana García',
  ticketType: 'vip',
  quantity: 2,
  paymentMethod: 'card',
  cardToken: 'TOK_FLAKY',
  walletAccountId: null,
  voucherCode: null,
  discountPercentage: 10,
  isGift: false,
  giftMessage: null,
  marketingOptIn: true,
}

const peticionApplePay: CheckoutRequest = {
  orderId: 'ORD-2046',
  eventId: 'EVT-9',
  customerEmail: 'luis@example.com',
  customerName: 'Luis Pérez',
  ticketType: 'vip',
  quantity: 3,
  paymentMethod: 'apple-pay',
  cardToken: null,
  walletAccountId: null,
  voucherCode: null,
  discountPercentage: 0,
  isGift: false,
  giftMessage: null,
  marketingOptIn: false,
  applePayToken: 'APAY-TOK-1',
}

console.log('--- Compra con tarjeta (con reintentos) ---')
console.log(service.checkout(peticionTarjeta))

console.log('\n--- Compra con Apple Pay ---')
console.log(service.checkout(peticionApplePay))

console.log('\n--- Log interno ---')
for (const linea of service.logLines) console.log(linea)

console.log('\n--- Sistemas avisados ---')
console.log('Buzón:', mailbox)
console.log('Analítica:', analyticsEvents)
console.log('Cola de impresión:', printQueue)
console.log('Alertas antifraude:', antifraudAlerts)

console.log('\n--- Ciclo de vida del pedido ---')
const order = new Order('ORD-2047')
for (const paso of ['reserve', 'markPaid', 'issueTickets'] as const) {
  order[paso]()
  console.log(`${order.status.padEnd(10)} | ${order.describe()}`)
  console.log(`${' '.repeat(10)} | acciones: ${order.availableActions().join(', ') || '—'}`)
}
