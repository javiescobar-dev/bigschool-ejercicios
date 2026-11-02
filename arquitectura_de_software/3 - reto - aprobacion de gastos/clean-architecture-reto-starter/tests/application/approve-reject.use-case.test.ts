import { describe, expect, it } from "bun:test";
import { SubmitExpenseUseCase } from "@/application/use-cases/submit-expense.use-case";
import { ApproveExpenseUseCase } from "@/application/use-cases/approve-expense.use-case";
import { RejectExpenseUseCase } from "@/application/use-cases/reject-expense.use-case";
import { InMemoryExpenseRepository } from "@/adapters/persistence/in-memory/in-memory-expense-repository";
import { InMemoryEmployeeRepository } from "@/adapters/persistence/in-memory/in-memory-employee-repository";
import { SystemClock } from "@/adapters/clock/system-clock";
import { NotificationPort } from "@/application/ports/notification-port";
import { EmployeeId } from "@/domain/value-objects/employee-id";
import { ExpenseId } from "@/domain/value-objects/expense-id";
import { Employee } from "@/domain/entities/employee";
import { Role } from "@/domain/value-objects/role";
import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

class FakeNotification implements NotificationPort {
  sent: Array<{ employeeId: string; expenseId: string }> = [];
  async sendTo(employeeId: EmployeeId, expenseId: ExpenseId): Promise<void> {
    this.sent.push({ employeeId: employeeId.value, expenseId: expenseId.value });
  }
}

describe("Approve/Reject use cases", () => {
  const clock = new SystemClock();

  const setup = () => {
    const expenseRepo = new InMemoryExpenseRepository();
    const employees = new Map<string, Employee>([
      ["1", new Employee(EmployeeId.fromString("1"), Role.fromString("Employee"))],
      ["4", new Employee(EmployeeId.fromString("4"), Role.fromString("Manager"))],
      ["5", new Employee(EmployeeId.fromString("5"), Role.fromString("Finance"))],
    ]);
    const employeeRepo = new InMemoryEmployeeRepository(employees);
    const notification = new FakeNotification();
    const submit = new SubmitExpenseUseCase(expenseRepo, clock, notification);
    const approve = new ApproveExpenseUseCase(expenseRepo, employeeRepo, clock, notification);
    const reject = new RejectExpenseUseCase(expenseRepo, employeeRepo, clock, notification);
    return { expenseRepo, employeeRepo, notification, submit, approve, reject };
  };

  it("manager approves pending expense and notifies requester", async () => {
    const { submit, approve, notification } = setup();
    const expense = await submit.execute({ requesterId: "1", amountCents: 15000, category: "training", description: "Curso" });
    await approve.execute({ expenseId: expense.id.value, deciderId: "4" });
    expect(expense.getStatus().value).toBe("approved");
    expect(notification.sent.length).toBe(1);
    expect(notification.sent[0].employeeId).toBe("1");
  });

  it("reject with reason and notifies", async () => {
    const { submit, reject, notification } = setup();
    const expense = await submit.execute({ requesterId: "1", amountCents: 15000, category: "meals", description: "Comida" });
    await reject.execute({ expenseId: expense.id.value, reason: "Fuera de presupuesto", deciderId: "4" });
    expect(expense.getStatus().value).toBe("rejected");
    expect(expense.getDecision()?.reason).toBe("Fuera de presupuesto");
    expect(notification.sent.length).toBe(1);
  });

  it("cannot resolve own request", async () => {
    const { submit, approve } = setup();
    const expense = await submit.execute({ requesterId: "1", amountCents: 15000, category: "training", description: "Curso" });
    expect(approve.execute({ expenseId: expense.id.value, deciderId: "1" })).rejects.toBeInstanceOf(DomainRuleViolation);
  });

  it("finance approves >1000€, manager cannot", async () => {
    const { submit, approve } = setup();
    const expense = await submit.execute({ requesterId: "1", amountCents: 150000, category: "travel", description: "Viaje" });
    expect(approve.execute({ expenseId: expense.id.value, deciderId: "4" })).rejects.toBeInstanceOf(DomainRuleViolation);
    await approve.execute({ expenseId: expense.id.value, deciderId: "5" });
    expect(expense.getStatus().value).toBe("approved");
  });

  it("cannot resolve already resolved", async () => {
    const { submit, approve } = setup();
    const expense = await submit.execute({ requesterId: "1", amountCents: 15000, category: "training", description: "Curso" });
    await approve.execute({ expenseId: expense.id.value, deciderId: "4" });
    expect(approve.execute({ expenseId: expense.id.value, deciderId: "4" })).rejects.toBeInstanceOf(DomainRuleViolation);
  });
});
