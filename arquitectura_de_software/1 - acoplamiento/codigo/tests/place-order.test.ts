import { describe, expect, test } from "bun:test";
import { IncrementalIdGenerator } from "@/adapters/identity/incremental-id-generator";
import { ConfigurablePaymentGateway } from "@/adapters/payment/configurable-payment-gateway";
import { InMemoryOrderRepository } from "@/adapters/persistence/in-memory-order-repository";
import { PlaceOrder } from "@/application/place-order";
import type { OrderId } from "@/domain/order";

const input = {
  customerEmail: "student@example.com",
  lines: [
    {
      productId: "book",
      quantity: 2,
      unitPriceCents: 2_500,
    },
  ],
} as const;

describe("PlaceOrder", () => {
  test("stores a paid order when payment is approved", async () => {
    const orders = new InMemoryOrderRepository();
    const useCase = new PlaceOrder(
      orders,
      new ConfigurablePaymentGateway(true),
      new IncrementalIdGenerator(),
    );

    const result = await useCase.execute(input);

    expect(result).toEqual({ ok: true, orderId: "order-1", totalCents: 5_000 });
    expect(await orders.findById("order-1" as OrderId)).not.toBeNull();
  });

  test("does not store an order when payment is declined", async () => {
    const orders = new InMemoryOrderRepository();
    const useCase = new PlaceOrder(
      orders,
      new ConfigurablePaymentGateway(false),
      new IncrementalIdGenerator(),
    );

    const result = await useCase.execute(input);

    expect(result).toEqual({ ok: false, reason: "payment_declined" });
    expect(await orders.findById("order-1" as OrderId)).toBeNull();
  });
});
