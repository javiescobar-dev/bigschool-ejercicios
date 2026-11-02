import { describe, expect, it } from "bun:test";
import { SubmitExpenseUseCase } from "@/application/use-cases/submit-expense.use-case";
import { InMemoryExpenseRepository } from "@/adapters/persistence/in-memory/in-memory-expense-repository";
import { SystemClock } from "@/adapters/clock/system-clock";
import { NotificationPort } from "@/application/ports/notification-port";
import { EmployeeId } from "@/domain/value-objects/employee-id";
import { ExpenseId } from "@/domain/value-objects/expense-id";

class FakeNotification implements NotificationPort {
  sent: Array<{ employeeId: string; expenseId: string }> = [];
  async sendTo(employeeId: EmployeeId, expenseId: ExpenseId): Promise<void> {
    this.sent.push({ employeeId: employeeId.value, expenseId: expenseId.value });
  }
}

describe("SubmitExpenseUseCase", () => {
  it("submits pending expense (>100 and <=1000) and does not notify on submit", async () => {
    const expenseRepo = new InMemoryExpenseRepository();
    const clock = new SystemClock();
    const notification = new FakeNotification();
    const useCase = new SubmitExpenseUseCase(expenseRepo, clock, notification);

    const expense = await useCase.execute({ requesterId: "1", amountCents: 15000, category: "training", description: "Curso" });
    expect(expense.getStatus().value).toBe("pending");
    expect(notification.sent.length).toBe(0);
  });

  it("auto-approves <=100 and notifies via use case flow not triggered here (notify after resolution) but policy applied", async () => {
    const expenseRepo = new InMemoryExpenseRepository();
    const clock = new SystemClock();
    const notification = new FakeNotification();
    const useCase = new SubmitExpenseUseCase(expenseRepo, clock, notification);

    const expense = await useCase.execute({ requesterId: "1", amountCents: 5000, category: "training", description: "Pequeño" });
    expect(expense.getStatus().value).toBe("approved");
  });
});
