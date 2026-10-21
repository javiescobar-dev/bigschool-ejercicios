import type { IdGenerator } from "@/application/ports/id-generator";
import type { OrderId } from "@/domain/order";

export class IncrementalIdGenerator implements IdGenerator {
  private current = 0;

  nextOrderId(): OrderId {
    this.current += 1;
    return `order-${this.current}` as OrderId;
  }
}
