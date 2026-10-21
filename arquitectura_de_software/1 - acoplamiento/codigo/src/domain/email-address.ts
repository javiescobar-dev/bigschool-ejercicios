import { DomainRuleViolation } from "@/domain/domain-rule-violation";

export class EmailAddress {
  private constructor(readonly value: string) {}

  static create(value: string): EmailAddress {
    const normalized = value.trim().toLowerCase();

    if (!normalized.includes("@")) {
      throw new DomainRuleViolation("Email address is invalid");
    }

    return new EmailAddress(normalized);
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }
}
