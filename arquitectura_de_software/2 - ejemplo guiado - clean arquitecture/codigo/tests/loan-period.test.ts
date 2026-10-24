import { describe, expect, test } from "bun:test";
import { LoanPeriod } from "@/domain/loan-period";
import { LocalDate } from "@/domain/local-date";

describe("LoanPeriod", () => {
  test("standard memberships receive fourteen days", () => {
    const period = LoanPeriod.forMembership(
      LocalDate.parse("2026-09-01"),
      "standard",
    );

    expect(period.dueOn.toString()).toBe("2026-09-15");
  });

  test("premium memberships receive twenty-eight days", () => {
    const period = LoanPeriod.forMembership(
      LocalDate.parse("2026-09-01"),
      "premium",
    );

    expect(period.dueOn.toString()).toBe("2026-09-29");
  });
});
