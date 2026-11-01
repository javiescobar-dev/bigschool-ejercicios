import { ExpenseRepository } from "@/application/ports/expense-repository";
import { Expense } from "@/domain/entities/expense";
import { ExpenseId } from "@/domain/value-objects/expense-id";

export class InMemoryExpenseRepository implements ExpenseRepository {
    private readonly expenses: Map<string, Expense>;

    // el constructor puede aceptar un mapa creado previamente
    constructor(initial?: Map<string, Expense>) {
        this.expenses = initial ?? new Map<string, Expense>();
    }

    async saveExpense(expense: Expense): Promise<void> {
        this.expenses.set(expense.id.value, expense);
    }

    async findExpenseById(id: ExpenseId): Promise<Expense | null> {
        return this.expenses.get(id.value) ?? null;
    }
}
