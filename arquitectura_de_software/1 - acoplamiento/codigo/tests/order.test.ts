import { describe, expect, test } from "bun:test";
import { EmailAddress } from "@/domain/email-address";
import { Money } from "@/domain/money";
import { Order, type OrderId, type ProductId } from "@/domain/order";

describe("Order", () => {
  test("cannot be paid while it is empty", () => {
    const order = Order.create(
      "order-1" as OrderId,
      EmailAddress.create("student@example.com"),
    );

    expect(() => order.markAsPaid()).toThrow("An empty order cannot be paid");
  });

  test("calculates the total from its lines", () => {
    const order = Order.create(
      "order-1" as OrderId,
      EmailAddress.create("student@example.com"),
    );

    order.addLine({
      productId: "book" as ProductId,
      quantity: 2,
      unitPrice: Money.fromCents(2_500),
    });

    expect(order.total().cents).toBe(5_000);
  });
});
