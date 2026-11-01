import { ExpenseId } from "@/domain/value-objects/expense-id";
import { EmployeeId } from "@/domain/value-objects/employee-id";
import { ExpenseRepository } from "@/application/ports/expense-repository";
import { EmployeeRepository } from "@/application/ports/employee-repository";
import { Clock } from "@/application/ports/clock";
import { NotificationPort } from "@/application/ports/notification-port";
import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

export class RejectExpenseUseCase {
    constructor(
        private readonly expenseRepository: ExpenseRepository,
        private readonly employeeRepository: EmployeeRepository,
        private readonly clock: Clock,
        private readonly notificationPort: NotificationPort
    ) { }

    async execute(input: { expenseId: string; reason: string; deciderId: string }): Promise<void> {
        const expenseId = ExpenseId.fromString(input.expenseId);
        const deciderId = EmployeeId.fromString(input.deciderId);

        // 1. Buscar gasto
        const expense = await this.expenseRepository.findExpenseById(expenseId);
        if (expense === null)
            throw new DomainRuleViolation(`No se ha encontrado el gasto.`);

        // 2. Buscar decidor
        const decider = await this.employeeRepository.findEmployeeById(deciderId);
        if (decider === null)
            throw new DomainRuleViolation(`No se ha encontrado el empleado que intenta resolver el gasto.`);

        // 3. Rechazar
        expense.reject(decider, input.reason, this.clock.now());

        // 4. Guardar
        await this.expenseRepository.saveExpense(expense);

        // 5. Notificar
        if (expense.getStatus().isResolved()) {
            try {
                await this.notificationPort.sendTo(expense.requesterId, expense.id);
            } catch {
                // Ignorar fallo de notificación: el gasto ya está resuelto
            }
        }
    }
}
