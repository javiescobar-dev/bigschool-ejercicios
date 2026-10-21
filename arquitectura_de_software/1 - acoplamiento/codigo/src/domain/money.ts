import { DomainRuleViolation } from "@/domain/domain-rule-violation";

export class Money {
  private constructor(readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isSafeInteger(cents) || cents < 0) {
      throw new DomainRuleViolation(
        "Money must contain a non-negative integer number of cents",
      );
    }

    return new Money(cents);
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  multiply(multiplier: number): Money {
    if (!Number.isSafeInteger(multiplier) || multiplier < 1) {
      throw new DomainRuleViolation("Money multiplier must be a positive integer");
    }

    return Money.fromCents(this.cents * multiplier);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
