import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

export class EmployeeId {
    private constructor(readonly value: string) { }

    static fromString(value: string): EmployeeId {
        if (!value || value.trim() === "") {
            throw new DomainRuleViolation("El ID del empleado no puede estar vacío.");
        }

        return new EmployeeId(value.trim());
    }

    static isEqual(firstValue: EmployeeId, secondValue: EmployeeId) : boolean {
        return firstValue.value === secondValue.value;
    }
}
