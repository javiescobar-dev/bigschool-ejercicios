import type { OrderId } from "@/domain/order";

export interface IdGenerator {
  nextOrderId(): OrderId;
}
