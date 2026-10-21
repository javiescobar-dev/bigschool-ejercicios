import { PaymentsGatewayV1 } from './legacy/payments-gateway-v1.ts'
import { Order } from './order.ts'
import type { CheckoutRequest, CheckoutResult, PaymentMethod, TicketType } from './types.ts'
import { LegacyGatewayAdapter } from './payments/legacy-gateway-adapter.ts'
import type { ChargeGateway, ChargeRequest, ChargeResult } from './payments/gateway.ts'
import type { ApprovedPayment, PaymentStrategy } from './payments/payment-strategy.ts'
import { defaultPaymentStrategies } from './payments/strategies/index.ts'
import type { PurchaseObserver, PurchaseEvent } from './notifications/purchase-observer.ts'
import { defaultPurchaseObservers } from './notifications/observers/index.ts'

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
  private readonly observers: PurchaseObserver[]

  constructor(
    legacyGateway: PaymentsGatewayV1 = new PaymentsGatewayV1(),
    options: Partial<CheckoutOptions> = {},
    strategies: PaymentStrategy[] = defaultPaymentStrategies(),
    observers: PurchaseObserver[] = defaultPurchaseObservers(),
  ) {
    this.gateway = new LegacyGatewayAdapter(legacyGateway)
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.strategies = new Map(
      strategies.map((strategy): [PaymentMethod, PaymentStrategy] => [strategy.method, strategy]),
    )
    this.observers = observers
  }

  checkout(request: CheckoutRequest): CheckoutResult {
    const cached = this.readCache(request)
    if (cached) return cached

    this.logStart(request)

    const strategy = this.validatedStrategy(request)
    const amount = this.price(request)

    const order = new Order(request.orderId)
    order.reserve()

    const outcome = strategy.charge(amount, request, (chargeRequest) =>
      this.callGateway(chargeRequest),
    )

    if (!outcome.ok) {
      order.cancel()
      return this.failureResult(request, order, outcome.message)
    }

    order.markPaid()
    order.issueTickets()

    this.notify(request, outcome.amountCharged)
    this.logEnd(request, order, outcome.amountCharged)

    const result = this.successResult(request, order, outcome)
    this.writeCache(request, result)
    return result
  }

  private readCache(request: CheckoutRequest): CheckoutResult | null {
    if (!this.options.withCache) return null

    const cached = this.responseCache.get(request.orderId)
    if (cached && this.options.withLogging) {
      this.logLines.push(`[cache] hit ${request.orderId}`)
    }
    return cached ?? null
  }

  private writeCache(request: CheckoutRequest, result: CheckoutResult): void {
    if (this.options.withCache) {
      this.responseCache.set(request.orderId, result)
    }
  }

  private logStart(request: CheckoutRequest): void {
    if (this.options.withLogging) {
      this.logLines.push(`[checkout] inicio ${request.orderId} (${request.paymentMethod})`)
    }
  }

  private logEnd(request: CheckoutRequest, order: Order, amountCharged: number): void {
    if (this.options.withLogging) {
      this.logLines.push(`[checkout] fin ${request.orderId} -> ${order.status} (${amountCharged} EUR)`)
    }
  }

  private validatedStrategy(request: CheckoutRequest): PaymentStrategy {
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
    return strategy
  }

  private price(request: CheckoutRequest): number {
    const basePrice = BASE_PRICES[request.ticketType]
    const gross = basePrice * request.quantity
    return gross - (gross * request.discountPercentage) / 100
  }

  private notify(request: CheckoutRequest, amountCharged: number): void {
    const purchaseEvent: PurchaseEvent = {
      orderId: request.orderId,
      eventId: request.eventId,
      customerEmail: request.customerEmail,
      quantity: request.quantity,
      amountCharged,
      paymentMethod: request.paymentMethod,
    }

    for (const observer of this.observers) {
      observer.onPurchase(purchaseEvent)
    }
  }

  private failureResult(
    request: CheckoutRequest,
    order: Order,
    message: string,
  ): CheckoutResult {
    return {
      orderId: request.orderId,
      status: order.status,
      amountCharged: 0,
      authorizationCode: null,
      message,
    }
  }

  private successResult(
    request: CheckoutRequest,
    order: Order,
    outcome: ApprovedPayment,
  ): CheckoutResult {
    return {
      orderId: request.orderId,
      status: order.status,
      amountCharged: outcome.amountCharged,
      authorizationCode: outcome.authorizationCode,
      message: outcome.message,
    }
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
