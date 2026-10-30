import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

export class Money {
  private constructor(readonly cents: number) { }

  static fromCents(cents: number): Money {
    if (!Number.isSafeInteger(cents) || cents <= 0) {
      throw new DomainRuleViolation("El importe debe ser mayor que 0 céntimos.");
    }

    return new Money(cents);
  }
}
