import { IncrementalIdGenerator } from "@/adapters/identity/incremental-id-generator";
import { ConfigurablePaymentGateway } from "@/adapters/payment/configurable-payment-gateway";
import { InMemoryOrderRepository } from "@/adapters/persistence/in-memory-order-repository";
import { PlaceOrderController } from "@/adapters/http/place-order-controller";
import { PlaceOrder } from "@/application/place-order";

const orders = new InMemoryOrderRepository();
const payments = new ConfigurablePaymentGateway(true);
const ids = new IncrementalIdGenerator();
const placeOrder = new PlaceOrder(orders, payments, ids);
const controller = new PlaceOrderController(placeOrder);

const response = await controller.handle({
  body: {
    customerEmail: "student@example.com",
    lines: [
      {
        productId: "clean-architecture-book",
        quantity: 2,
        unitPriceCents: 2_500,
      },
    ],
  },
});

console.log(response);
