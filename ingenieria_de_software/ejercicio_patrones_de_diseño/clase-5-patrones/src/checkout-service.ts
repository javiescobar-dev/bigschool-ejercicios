import { PaymentsGatewayV1 } from './legacy/payments-gateway-v1.ts'
import { Order } from './order.ts'
import {
  analyticsService,
  emailService,
  inventoryService,
  loyaltyService,
  warehouseService,
} from './notifications/side-effects.ts'
import type { CheckoutRequest, CheckoutResult, PaymentMethod, TicketType } from './types.ts'
import { LegacyGatewayAdapter } from './payments/legacy-gateway-adapter.ts'
import type { ChargeGateway, ChargeRequest, ChargeResult } from './payments/gateway.ts'
import type { PaymentStrategy } from './payments/payment-strategy.ts'
import { defaultPaymentStrategies } from './payments/strategies/index.ts'

export interface CheckoutOptions {
  withLogging: boolean
  withRetry: boolean
  retryAttempts: number
  withCache: boolean
}

const DEFAULT_OPTIONS: CheckoutOptions = {
  withLogging: false,
  withRetry: false,
  retryAttempts: 1,
  withCache: false,
}

const BASE_PRICES: Record<TicketType, number> = {
  general: 30,
  vip: 90,
  'early-bird': 20,
}

export class CheckoutService {
  private readonly options: CheckoutOptions
  private readonly responseCache = new Map<string, CheckoutResult>()
  readonly logLines: string[] = []

  private readonly gateway: ChargeGateway
  private readonly strategies: Map<PaymentMethod, PaymentStrategy>

  constructor(
    legacyGateway: PaymentsGatewayV1 = new PaymentsGatewayV1(),
    options: Partial<CheckoutOptions> = {},
    strategies: PaymentStrategy[] = defaultPaymentStrategies(),
  ) {
    this.gateway = new LegacyGatewayAdapter(legacyGateway)
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.strategies = new Map(
      strategies.map((strategy): [PaymentMethod, PaymentStrategy] => [strategy.method, strategy]),
    )
  }

  checkout(request: CheckoutRequest): CheckoutResult {
    if (this.options.withCache) {
      const cached = this.responseCache.get(request.orderId)
      if (cached) {
        if (this.options.withLogging) this.logLines.push(`[cache] hit ${request.orderId}`)
        return cached
      }
    }
    if (this.options.withLogging) {
      this.logLines.push(`[checkout] inicio ${request.orderId} (${request.paymentMethod})`)
    }

    // ---------- Validaciones ----------
    if (!request.customerEmail.includes('@')) {
      throw new Error(`Email inválido: ${request.customerEmail}`)
    }
    if (request.quantity <= 0) {
      throw new Error('Hay que comprar al menos una entrada')
    }
    if (request.quantity > 10) {
      throw new Error('No se pueden comprar más de 10 entradas en un mismo pedido')
    }
    if (request.discountPercentage < 0 || request.discountPercentage > 100) {
      throw new Error('El descuento debe estar entre 0 y 100')
    }
    if (request.ticketType === 'vip' && request.quantity > 4) {
      throw new Error('Máximo 4 entradas VIP por pedido')
    }
    if (request.isGift && request.quantity > 1) {
      throw new Error('Los pedidos de regalo solo admiten una entrada')
    }
    const strategy = this.strategies.get(request.paymentMethod)
    if (!strategy) throw new Error(`Método de pago no soportado: ${request.paymentMethod}`)
    strategy.validate(request)

    // ---------- Importe ----------
    const basePrice = BASE_PRICES[request.ticketType]
    const gross = basePrice * request.quantity
    const discounted = gross - (gross * request.discountPercentage) / 100

    const order = new Order(request.orderId)
    order.reserve()

    // ---------- Cobro ----------
    const outcome = strategy.charge(discounted, request, (chargeRequest) =>
      this.callGateway(chargeRequest),
    )

    if (!outcome.ok) {
      order.cancel()
      return {
        orderId: request.orderId,
        status: order.status,
        amountCharged: 0,
        authorizationCode: null,
        message: outcome.message,
      }
    }

    order.markPaid()
    order.issueTickets()

    // ---------- Avisar a todo el mundo ----------
    emailService.sendPurchaseConfirmation(request.customerEmail, request.orderId)
    analyticsService.track('ticket_purchased', {
      orderId: request.orderId,
      eventId: request.eventId,
      amount: outcome.amountCharged,
      method: request.paymentMethod,
    })
    inventoryService.release(request.eventId, request.quantity)
    loyaltyService.award(request.customerEmail, Math.floor(outcome.amountCharged))
    warehouseService.schedulePrinting(request.orderId, request.quantity)

    if (this.options.withLogging) {
      this.logLines.push(`[checkout] fin ${request.orderId} -> ${order.status} (${outcome.amountCharged} EUR)`)
    }

    const result: CheckoutResult = {
      orderId: request.orderId,
      status: order.status,
      amountCharged: outcome.amountCharged,
      authorizationCode: outcome.authorizationCode,
      message: outcome.message,
    }

    if (this.options.withCache) {
      this.responseCache.set(request.orderId, result)
    }

    return result
  }
  private callGateway(request: ChargeRequest): ChargeResult {
    if (this.options.withLogging) {
      this.logLines.push(`[gateway] ${request.operation} ${request.amountInCents}`)
    }

    let result = this.gateway.charge(request)

    if (this.options.withRetry) {
      let attempt = 1
      while (!result.ok && result.retryable && attempt < this.options.retryAttempts) {
        attempt += 1
        if (this.options.withLogging) {
          this.logLines.push(`[gateway] reintento ${attempt}`)
        }
        result = this.gateway.charge(request)
      }
    }

    return result
  }
}

/**
 * Construye una petición de compra.
 */
export function createCheckoutRequest(
  orderId: string,
  eventId: string,
  customerEmail: string,
  customerName: string,
  ticketType: TicketType,
  quantity: number,
  paymentMethod: CheckoutRequest['paymentMethod'],
  cardToken: string | null,
  walletAccountId: string | null,
  voucherCode: string | null,
  discountPercentage: number,
  isGift: boolean,
  giftMessage: string | null,
  marketingOptIn: boolean,
): CheckoutRequest {
  return {
    orderId,
    eventId,
    customerEmail,
    customerName,
    ticketType,
    quantity,
    paymentMethod,
    cardToken,
    walletAccountId,
    voucherCode,
    discountPercentage,
    isGift,
    giftMessage,
    marketingOptIn,
  }
}
