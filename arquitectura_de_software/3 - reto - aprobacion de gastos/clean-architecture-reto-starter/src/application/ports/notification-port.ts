import { EmployeeId } from "@/domain/value-objects/employee-id";
import { ExpenseId } from "@/domain/value-objects/expense-id";

export interface NotificationPort {
    sendTo(employeeId: EmployeeId, expenseId: ExpenseId): Promise<void>;
}
