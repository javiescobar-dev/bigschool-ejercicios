import type {
  PaymentGateway,
  PaymentRequest,
  PaymentResult,
} from "@/application/ports/payment-gateway";

export class ConfigurablePaymentGateway implements PaymentGateway {
  constructor(private readonly shouldApprove: boolean) {}

  async charge(_request: PaymentRequest): Promise<PaymentResult> {
    return this.shouldApprove
      ? { approved: true, transactionId: "payment-001" }
      : { approved: false };
  }
}
