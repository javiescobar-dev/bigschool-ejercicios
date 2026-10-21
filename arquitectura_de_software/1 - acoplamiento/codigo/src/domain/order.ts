import { DomainRuleViolation } from "@/domain/domain-rule-violation";
import { EmailAddress } from "@/domain/email-address";
import { Money } from "@/domain/money";

export type OrderId = string & { readonly __brand: "OrderId" };
export type ProductId = string & { readonly __brand: "ProductId" };

export type OrderLine = Readonly<{
  productId: ProductId;
  quantity: number;
  unitPrice: Money;
}>;

export class Order {
  readonly lines: OrderLine[] = [];
  private paid = false;

  private constructor(
    readonly id: OrderId,
    readonly customerEmail: EmailAddress,
  ) {}

  static create(id: OrderId, customerEmail: EmailAddress): Order {
    return new Order(id, customerEmail);
  }

  addLine(line: OrderLine): void {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) {
      throw new DomainRuleViolation(
        "Order line quantity must be a positive integer",
      );
    }

    this.lines.push(line);
  }

  total(): Money {
    return this.lines.reduce(
      (total, line) => total.add(line.unitPrice.multiply(line.quantity)),
      Money.fromCents(0),
    );
  }

  markAsPaid(): void {
    if (this.lines.length === 0) {
      throw new DomainRuleViolation("An empty order cannot be paid");
    }

    this.paid = true;
  }

  isPaid(): boolean {
    return this.paid;
  }
}
