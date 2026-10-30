import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

const STATUSES = ["pending", "approved", "rejected"] as const;
export type ExpenseStatusType = (typeof STATUSES)[number];

export class ExpenseStatus {
    private constructor(readonly value: ExpenseStatusType) { }

    static fromString(value: string): ExpenseStatus {
        if (!STATUSES.includes(value as ExpenseStatusType)) {
            throw new DomainRuleViolation(
                `El estado del gasto debe ser uno de los siguientes: ${STATUSES.join(", ")}.`,
            );
        }

        return new ExpenseStatus(value as ExpenseStatusType);
    }

    isResolved(): boolean {
        return this.value === "approved" || this.value === "rejected";
    }
}
