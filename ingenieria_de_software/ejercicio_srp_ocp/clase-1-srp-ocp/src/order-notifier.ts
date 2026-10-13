import { emailGateway } from './infra/email-gateway.ts'
import type { CalculatedOrder } from './types.ts'

export class OrderNotifier {
  notify(order: CalculatedOrder, invoice: string): void {
    emailGateway.send(
        order.customer.email,
        `Tu pedido ${order.orderId} está confirmado`,
        `Hola ${order.customer.name},\n\nGracias por tu compra.\n\n${invoice}`,
    )
  }
}
