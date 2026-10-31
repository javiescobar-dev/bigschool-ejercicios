import { ExpenseId } from "@/domain/value-objects/expense-id";
import { Expense } from "@/domain/entities/expense";

export interface ExpenseRepository {
    findExpenseById(id: ExpenseId): Promise<Expense | null>;
    saveExpense(expense: Expense): Promise<void>;
}
