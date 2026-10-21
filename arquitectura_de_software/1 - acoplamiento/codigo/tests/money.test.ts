import { describe, expect, test } from "bun:test";
import { Money } from "@/domain/money";

describe("Money", () => {
  test("multiplies an amount without losing the value semantics", () => {
    const price = Money.fromCents(2_500);

    expect(price.multiply(2).equals(Money.fromCents(5_000))).toBe(true);
  });
});
