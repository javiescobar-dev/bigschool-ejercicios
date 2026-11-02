import { describe, expect, it } from "bun:test";
import { Expense } from "@/domain/entities/expense";
import { EmployeeId } from "@/domain/value-objects/employee-id";
import { Money } from "@/domain/value-objects/money";
import { Category } from "@/domain/value-objects/category";
import { Description } from "@/domain/value-objects/description";

describe("Expense policy (automatic)", () => {
  const requester = EmployeeId.fromString("req-1");
  const now = new Date();

  it("<= 100€ approved automatically", () => {
    const expense = Expense.submit(
      requester,
      Money.fromCents(5000),
      Category.fromString("training"),
      Description.fromString("Curso"),
      now
    );
    expect(expense.getStatus().value).toBe("approved");
    expect(expense.getDecision()).toBeDefined();
    expect(expense.getDecision()!.decidedBy.value).toBe("SYSTEM");
  });

  it(">100€ and <=1000€ pending", () => {
    const expense = Expense.submit(
      requester,
      Money.fromCents(15000),
      Category.fromString("meals"),
      Description.fromString("Comida"),
      now
    );
    expect(expense.getStatus().value).toBe("pending");
    expect(expense.getDecision()).toBeUndefined();
  });

  it(">1000€ pending", () => {
    const expense = Expense.submit(
      requester,
      Money.fromCents(150000),
      Category.fromString("travel"),
      Description.fromString("Viaje"),
      now
    );
    expect(expense.getStatus().value).toBe("pending");
    expect(expense.getDecision()).toBeUndefined();
  });

  it("personal category rejected automatically with reason", () => {
    const expense = Expense.submit(
      requester,
      Money.fromCents(5000),
      Category.fromString("personal"),
      Description.fromString("Personal"),
      now
    );
    expect(expense.getStatus().value).toBe("rejected");
    expect(expense.getDecision()).toBeDefined();
    expect(expense.getDecision()!.reason).toBe("Gasto de categoría personal");
    expect(expense.getDecision()!.decidedBy.value).toBe("SYSTEM");
  });
});
