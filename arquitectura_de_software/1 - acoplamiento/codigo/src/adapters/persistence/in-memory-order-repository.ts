import type { OrderRepository } from "@/application/ports/order-repository";
import type { Order, OrderId } from "@/domain/order";

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<OrderId, Order>();

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async findById(id: OrderId): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }
}
