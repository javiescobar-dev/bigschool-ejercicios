import { describe, expect, it } from "bun:test";
import { Decision } from "@/domain/value-objects/decision";
import { EmployeeId } from "@/domain/value-objects/employee-id";
import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

describe("Decision", () => {
  const now = new Date();
  const decider = EmployeeId.fromString("4");

  it("approve creates decision without reason", () => {
    const d = Decision.approve(decider, now);
    expect(d.result).toBe("approved");
    expect(d.reason).toBeUndefined();
  });

  it("reject requires non-empty reason", () => {
    expect(() => Decision.reject(decider, "", now)).toThrow(DomainRuleViolation);
    expect(() => Decision.reject(decider, "   ", now)).toThrow(DomainRuleViolation);
  });

  it("reject trims reason", () => {
    const d = Decision.reject(decider, "  Fuera de presupuesto  ", now);
    expect(d.reason).toBe("Fuera de presupuesto");
    expect(d.result).toBe("rejected");
  });
});
