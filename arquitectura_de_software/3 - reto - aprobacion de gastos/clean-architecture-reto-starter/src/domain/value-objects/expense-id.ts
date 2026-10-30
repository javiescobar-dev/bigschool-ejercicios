import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

export class ExpenseId {
    private constructor(readonly value: string) { }

    static fromString(value: string): ExpenseId {
        if (!value || value.trim() === "") {
            throw new DomainRuleViolation("El ID del gasto no puede estar vacío.");
        }

        return new ExpenseId(value.trim());
    }
}
