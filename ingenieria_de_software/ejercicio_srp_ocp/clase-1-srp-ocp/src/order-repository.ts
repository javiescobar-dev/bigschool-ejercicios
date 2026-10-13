import { database } from './infra/database.ts'
import type { CalculatedOrder } from './types.ts'

export class OrderRepository {
  save(order: CalculatedOrder): void {
    database.insertOrder({
        id: order.orderId,
        customerId: order.customer.id,
        total: order.total,
        createdAt: new Date().toISOString(),
    })
  }
}
