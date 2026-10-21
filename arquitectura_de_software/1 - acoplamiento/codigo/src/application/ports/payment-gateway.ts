import type { EmailAddress } from "@/domain/email-address";
import type { Money } from "@/domain/money";

export type PaymentRequest = Readonly<{
  customerEmail: EmailAddress;
  amount: Money;
}>;

export type PaymentResult =
  | { readonly approved: true; readonly transactionId: string }
  | { readonly approved: false };

export interface PaymentGateway {
  charge(request: PaymentRequest): Promise<PaymentResult>;
}
