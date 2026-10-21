import { describe, expect, test } from "bun:test";
import { PlaceOrderController } from "@/adapters/http/place-order-controller";
import { IncrementalIdGenerator } from "@/adapters/identity/incremental-id-generator";
import { ConfigurablePaymentGateway } from "@/adapters/payment/configurable-payment-gateway";
import { InMemoryOrderRepository } from "@/adapters/persistence/in-memory-order-repository";
import { PlaceOrder } from "@/application/place-order";

function createController(): PlaceOrderController {
  return new PlaceOrderController(
    new PlaceOrder(
      new InMemoryOrderRepository(),
      new ConfigurablePaymentGateway(true),
      new IncrementalIdGenerator(),
    ),
  );
}

describe("PlaceOrderController", () => {
  test("rejects malformed external data at the HTTP boundary", async () => {
    const response = await createController().handle({ body: { lines: [] } });

    expect(response.status).toBe(400);
  });

  test("translates a domain rule violation to HTTP", async () => {
    const response = await createController().handle({
      body: { customerEmail: "student@example.com", lines: [] },
    });

    expect(response).toEqual({
      status: 422,
      body: {
        error: "business_rule_violation",
        message: "An empty order cannot be paid",
      },
    });
  });
});
