import { DomainRuleViolation } from "@/domain/errors/domain-rule-violation";

const CATEGORIES = ["travel", "meals", "equipment", "training", "personal"] as const;
export type CategoryType = (typeof CATEGORIES)[number];

export class Category {
    private constructor(readonly value: CategoryType) { }

    static fromString(value: string): Category {
        if (!CATEGORIES.includes(value as CategoryType)) {
            throw new DomainRuleViolation(
                `La categoría debe ser una de las siguientes: ${CATEGORIES.join(", ")}.`,
            );
        }

        return new Category(value as CategoryType);
    }

    isPersonal(): boolean {
        return this.value === "personal";
    }
}
