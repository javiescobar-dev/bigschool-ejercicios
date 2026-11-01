import { NotificationPort } from "@/application/ports/notification-port";
import { EmployeeId } from "@/domain/value-objects/employee-id";
import { ExpenseId } from "@/domain/value-objects/expense-id";

export class ConsoleNotificationAdapter implements NotificationPort {
    async sendTo(employeeId: EmployeeId, expenseId: ExpenseId): Promise<void> {
        console.log(`Notificación enviada al empleado ${employeeId.value} sobre el gasto ${expenseId.value}`);
    }
}
