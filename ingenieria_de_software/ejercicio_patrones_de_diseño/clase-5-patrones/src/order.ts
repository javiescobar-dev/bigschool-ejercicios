export type OrderStatus = 'created' | 'reserved' | 'paid' | 'issued' | 'cancelled' | 'refunded'

export type OrderAction = 'reserve' | 'markPaid' | 'issueTickets' | 'cancel' | 'refund'

/**
 * Qué transiciones son legales desde cada estado.
 * Una sola tabla sustituye los tres `switch` y las cadenas de `if`.
 */
const TRANSITIONS: Record<OrderStatus, Partial<Record<OrderAction, OrderStatus>>> = {
  created: { reserve: 'reserved', cancel: 'cancelled' },
  reserved: { markPaid: 'paid', cancel: 'cancelled' },
  paid: { issueTickets: 'issued', refund: 'refunded', cancel: 'cancelled' },
  issued: { refund: 'refunded' },
  cancelled: {},
  refunded: {},
}

/**
 * Acciones que el pedido anuncia como disponibles.
 * Ojo: en `paid` no anuncia "cancel", aunque `cancel()` sí lo permite.
 * Se conserva el comportamiento original (y sus tests).
 */
const AVAILABLE_ACTIONS: Record<OrderStatus, OrderAction[]> = {
  created: ['reserve', 'cancel'],
  reserved: ['markPaid', 'cancel'],
  paid: ['issueTickets', 'refund'],
  issued: ['refund'],
  cancelled: [],
  refunded: [],
}

const DESCRIPTIONS: Record<OrderStatus, string> = {
  created: 'Pedido iniciado, sin entradas bloqueadas todavía',
  reserved: 'Entradas bloqueadas durante 15 minutos a la espera del pago',
  paid: 'Pago confirmado, pendiente de emitir las entradas',
  issued: 'Entradas emitidas y enviadas al cliente',
  cancelled: 'Pedido cancelado, las entradas han vuelto al aforo',
  refunded: 'Pedido reembolsado al cliente',
}

const FINAL_STATUSES = new Set<OrderStatus>(['cancelled', 'refunded'])

/**
 * Pedido de entradas. Lleva el estado y controla qué transiciones son legales.
 */
export class Order {
  private currentStatus: OrderStatus = 'created'
  private readonly transitions: OrderStatus[] = ['created']

  constructor(readonly id: string) {}

  get status(): OrderStatus {
    return this.currentStatus
  }

  history(): OrderStatus[] {
    return [...this.transitions]
  }

  reserve(): void {
    this.transition('reserve')
  }

  markPaid(): void {
    this.transition('markPaid')
  }

  issueTickets(): void {
    this.transition('issueTickets')
  }

  cancel(): void {
    this.transition('cancel')
  }

  refund(): void {
    this.transition('refund')
  }

  availableActions(): string[] {
    return [...AVAILABLE_ACTIONS[this.currentStatus]]
  }

  describe(): string {
    return DESCRIPTIONS[this.currentStatus]
  }

  isFinal(): boolean {
    return FINAL_STATUSES.has(this.currentStatus)
  }

  private transition(action: OrderAction): void {
    const next = TRANSITIONS[this.currentStatus][action]
    if (!next) throw new Error(this.errorFor(action))
    this.moveTo(next)
  }

  private errorFor(action: OrderAction): string {
    if (action === 'cancel') {
      if (this.currentStatus === 'issued') {
        return 'Un pedido con entradas emitidas ya no se puede cancelar, hay que reembolsarlo'
      }
      if (this.currentStatus === 'cancelled') {
        return 'El pedido ya estaba cancelado'
      }
      if (this.currentStatus === 'refunded') {
        return 'Un pedido reembolsado no se puede cancelar'
      }
      return `No se puede cancelar un pedido en estado "${this.currentStatus}"`
    }

    if (action === 'reserve') {
      return `No se puede reservar un pedido en estado "${this.currentStatus}"`
    }
    if (action === 'markPaid') {
      return `No se puede cobrar un pedido en estado "${this.currentStatus}"`
    }
    if (action === 'issueTickets') {
      return `No se pueden emitir entradas de un pedido en estado "${this.currentStatus}"`
    }
    return `No se puede reembolsar un pedido en estado "${this.currentStatus}"`
  }

  private moveTo(status: OrderStatus): void {
    this.currentStatus = status
    this.transitions.push(status)
  }
}
