import { describe, expect, it } from "bun:test";
import { Expense } from "@/domain/entities/expense";
import { Employee } from "@/domain/entities/employee";
import { EmployeeId } from "@/domain/value-objects/employee-id";
import { Role } from "@/domain/value-objects/role";
import { Money } from "@/domain/value-objects/money";
import { Category } from "@/domain/value-objects/category";
import { Description } from "@/domain/value-objects/description";
import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

describe("Expense resolution guards", () => {
  const now = new Date();

  it("same requester cannot resolve own request", () => {
    const requesterId = EmployeeId.fromString("1");
    const requester = new Employee(requesterId, Role.fromString("Employee"));
    const expense = Expense.submit(requesterId, Money.fromCents(15000), Category.fromString("training"), Description.fromString("X"), now);
    expect(() => expense.approve(requester, now)).toThrow(DomainRuleViolation);
  });

  it("manager cannot approve >1000€", () => {
    const requesterId = EmployeeId.fromString("1");
    const manager = new Employee(EmployeeId.fromString("4"), Role.fromString("Manager"));
    const expense = Expense.submit(requesterId, Money.fromCents(150000), Category.fromString("travel"), Description.fromString("Y"), now);
    expect(() => expense.approve(manager, now)).toThrow(DomainRuleViolation);
  });

  it("finance can approve >1000€", () => {
    const requesterId = EmployeeId.fromString("1");
    const finance = new Employee(EmployeeId.fromString("5"), Role.fromString("Finance"));
    const expense = Expense.submit(requesterId, Money.fromCents(150000), Category.fromString("travel"), Description.fromString("Y"), now);
    expense.approve(finance, now);
    expect(expense.getStatus().value).toBe("approved");
  });

  it("manager can approve between 101€ and 1000€", () => {
    const requesterId = EmployeeId.fromString("1");
    const manager = new Employee(EmployeeId.fromString("4"), Role.fromString("Manager"));
    const expense = Expense.submit(requesterId, Money.fromCents(15000), Category.fromString("meals"), Description.fromString("Z"), now);
    expense.approve(manager, now);
    expect(expense.getStatus().value).toBe("approved");
  });

  it("cannot resolve already resolved expense", () => {
    const requesterId = EmployeeId.fromString("1");
    const manager = new Employee(EmployeeId.fromString("4"), Role.fromString("Manager"));
    const expense = Expense.submit(requesterId, Money.fromCents(15000), Category.fromString("meals"), Description.fromString("Z"), now);
    expense.approve(manager, now);
    expect(() => expense.approve(manager, now)).toThrow(DomainRuleViolation);
  });

  it("reject requires reason", () => {
    const requesterId = EmployeeId.fromString("1");
    const manager = new Employee(EmployeeId.fromString("4"), Role.fromString("Manager"));
    const expense = Expense.submit(requesterId, Money.fromCents(15000), Category.fromString("meals"), Description.fromString("Z"), now);
    expect(() => expense.reject(manager, "   ", now)).toThrow(DomainRuleViolation);
  });
});
