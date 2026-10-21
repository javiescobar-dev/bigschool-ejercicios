import type { IdGenerator } from "@/application/ports/id-generator";
import type { OrderRepository } from "@/application/ports/order-repository";
import type { PaymentGateway } from "@/application/ports/payment-gateway";
import { EmailAddress } from "@/domain/email-address";
import { Money } from "@/domain/money";
import { Order, type ProductId } from "@/domain/order";

export type PlaceOrderInput = Readonly<{
  customerEmail: string;
  lines: ReadonlyArray<{
    productId: string;
    quantity: number;
    unitPriceCents: number;
  }>;
}>;

export type PlaceOrderResult =
  | {
      readonly ok: true;
      readonly orderId: string;
      readonly totalCents: number;
    }
  | {
      readonly ok: false;
      readonly reason: "payment_declined";
    };

export class PlaceOrder {
  constructor(
    private readonly orders: OrderRepository,
    private readonly payments: PaymentGateway,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    const order = Order.create(
      this.ids.nextOrderId(),
      EmailAddress.create(input.customerEmail),
    );

    for (const line of input.lines) {
      order.addLine({
        productId: line.productId as ProductId,
        quantity: line.quantity,
        unitPrice: Money.fromCents(line.unitPriceCents),
      });
    }

    const payment = await this.payments.charge({
      customerEmail: order.customerEmail,
      amount: order.total(),
    });

    if (!payment.approved) {
      return { ok: false, reason: "payment_declined" };
    }

    order.markAsPaid();
    await this.orders.save(order);

    return {
      ok: true,
      orderId: order.id,
      totalCents: order.total().cents,
    };
  }
}
