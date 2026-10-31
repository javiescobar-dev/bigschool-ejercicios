import { randomUUID } from "crypto";
import { ExpenseId } from "@/domain/value-objects/expense-id";
import { EmployeeId } from "@/domain/value-objects/employee-id";
import { Money } from "@/domain/value-objects/money";
import { Category } from "@/domain/value-objects/category";
import { Description } from "@/domain/value-objects/description";
import { ExpenseStatus } from "@/domain/value-objects/expense-status";
import { Decision } from "@/domain/value-objects/decision";
import { Employee } from "@/domain/entities/employee";
import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

export class Expense {
    private constructor(
        readonly id: ExpenseId,
        readonly requesterId: EmployeeId,
        readonly amount: Money,
        readonly category: Category,
        readonly description: Description,
        private status: ExpenseStatus,
        private decision?: Decision
    ) { }

    static submit(requesterId: EmployeeId, amount: Money, category: Category, description: Description, decidedAt: Date): Expense {
        const id = ExpenseId.fromString(randomUUID());

        // los gastos personales son rechazados automaticamente
        if (category.isPersonal()) {
            return new Expense(
                id,
                requesterId,
                amount,
                category,
                description,
                ExpenseStatus.fromString("rejected"),
                Decision.reject(EmployeeId.fromString('SYSTEM'), "Gasto de categoría personal", decidedAt)
            );
        }

        // los gastos que no superan los 100€ son aprobados automaticamente
        if (amount.cents <= 10000) {
            return new Expense(
                id,
                requesterId,
                amount,
                category,
                description,
                ExpenseStatus.fromString("approved"),
                Decision.approve(EmployeeId.fromString('SYSTEM'), decidedAt)
            );
        }

        // el resto de gastos deben procesarse manualmente, quedan pendientes
        return new Expense(
            id,
            requesterId,
            amount,
            category,
            description,
            ExpenseStatus.fromString("pending")
        );
    }

    approve(decider: Employee, decidedAt: Date): void {
        this.validateResolution(decider);
        this.decision = Decision.approve(decider.id, decidedAt);
        this.status = ExpenseStatus.fromString("approved");
    }

    reject(decider: Employee, reason: string, decidedAt: Date): void {
        this.validateResolution(decider);
        this.decision = Decision.reject(decider.id, reason, decidedAt);
        this.status = ExpenseStatus.fromString("rejected");
    }

    private validateResolution(decider: Employee): void {
        if (this.status.isResolved()) {
            throw new DomainRuleViolation(
                `El gasto ya ha sido resuelto previamente, no se puede realizar esa operación de nuevo.`,
            );
        }

        if (EmployeeId.isEqual(this.requesterId, decider.id)) {
            throw new DomainRuleViolation(
                `El mismo empleado no puede resolver su propia solicitud, no se puede realizar la operación.`,
            );
        }

        // los gastos mayores a 100€ y menores a 1000€ los gestiona el rol Manager
        const needsManager = this.amount.cents > 10000 && this.amount.cents <= 100000;
        // los gastos superiores a 1000€ los gestiona el rol Finance
        const needsFinance = this.amount.cents > 100000;

        if ((needsManager && !decider.role.isManager()) || (needsFinance && !decider.role.isFinance())) {
            throw new DomainRuleViolation(
                `El rol del empleado que toma la decisión no es el requerido, no se puede realizar la operación.`,
            );
        }
    }
}
