import { describe, expect, test } from "bun:test";
import { DomainRuleViolation } from "@/domain/domain-rule-violation";
import { LocalDate } from "@/domain/local-date";

describe("LocalDate", () => {
  test("adds calendar days across a month boundary", () => {
    const result = LocalDate.parse("2026-01-25").plusDays(14);

    expect(result.toString()).toBe("2026-02-08");
  });

  test("rejects impossible calendar dates", () => {
    expect(() => LocalDate.parse("2026-02-30")).toThrow(
      DomainRuleViolation,
    );
  });
});
