import { Expense } from "@/domain/entities/expense";
import { EmployeeId } from "@/domain/value-objects/employee-id";
import { Money } from "@/domain/value-objects/money";
import { Category } from "@/domain/value-objects/category";
import { Description } from "@/domain/value-objects/description";
import { ExpenseRepository } from "@/application/ports/expense-repository";
import { Clock } from "@/application/ports/clock";
import { NotificationPort } from "@/application/ports/notification-port";

export class SubmitExpenseUseCase {
    constructor(
        private readonly expenseRepository: ExpenseRepository,
        private readonly clock: Clock,
        private readonly notificationPort: NotificationPort,
    ) { }

    async execute(input: { requesterId: string; amountCents: number; category: string; description: string; }): Promise<Expense> {
        // 1. Crear VOs
        const requesterId = EmployeeId.fromString(input.requesterId);
        const amount = Money.fromCents(input.amountCents);
        const category = Category.fromString(input.category);
        const description = Description.fromString(input.description);

        // 2. Llamar a Expense.submit
        const expense = Expense.submit(requesterId, amount, category, description, this.clock.now());

        // 3. Guardar
        await this.expenseRepository.saveExpense(expense);

        // 4. Notificar si resuelto automáticamente
        if (expense.getStatus().isResolved()) {
            try {
                await this.notificationPort.sendTo(expense.requesterId, expense.id);
            } catch {
                // Ignorar fallo de notificación: el gasto ya está resuelto
            }
        }

        // 5. Devolver expense
        return expense;
    }
}
