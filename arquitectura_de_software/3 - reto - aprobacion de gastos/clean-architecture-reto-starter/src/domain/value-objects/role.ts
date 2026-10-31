import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

const ROLES = ["Employee", "Manager", "Finance"] as const;
export type RoleType = (typeof ROLES)[number];

export class Role {
    private constructor(readonly value: RoleType) { }

    static fromString(value: string): Role {
        if (!ROLES.includes(value as RoleType)) {
            throw new DomainRuleViolation(
                `El rol debe ser uno de los siguientes: ${ROLES.join(", ")}.`,
            );
        }

        return new Role(value as RoleType);
    }

    isManager(): boolean {
        return this.value === "Manager";
    }

    isFinance(): boolean {
        return this.value === "Finance";
    }

    isEmployee(): boolean {
        return this.value === "Employee";
    }
}
